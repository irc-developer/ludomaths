import { useId } from 'react';
import { individualProfile, replacePrimaryProfile } from '@application/dice/squadScenario';
import type { CombatScenarioInput } from '@application/dice/combatScenario';
import { useCatalog } from '../../catalog/CatalogContext';
import { resolveCatalogScenario } from '@application/dice/catalogScenario';
import { NumberInput } from '../../components/NumberInput';
import { InputField } from '../../components/InputField';
import { s, type ScenarioKey } from '../../i18n/scenario';
import { scenarioInput, scenarioPanel } from './scenarioStyles';
import { useCombatScenario } from './CombatScenarioContext';

type Profile = CombatScenarioInput;
interface Props { params: Profile; onChange: (next: Profile) => void }
export function SquadCounter({ label, value, onChange, max = 100 }: { label: string; value: number; onChange: (next: number) => void; max?: number }) {
  const id = useId(); const { setDraftInvalid } = useCombatScenario();
  return <div className="squad-counter"><label htmlFor={id}>{label}</label><div className="squad-counter-controls">
    <button type="button" aria-label={`${label} −1`} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
    <NumberInput id={id} value={value} min={1} max={max} onChange={onChange} onDraftValidityChange={setDraftInvalid} />
    <button type="button" aria-label={`${label} +1`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
  </div></div>;
}

function ProfileEditor({ profile, base, side, onChange }: { profile: Profile; base: Profile; side: 'attacker' | 'defender'; onChange: (profile: Profile) => void }) {
  const { catalog } = useCatalog(); const { entryMode, setDraftInvalid } = useCombatScenario();
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => onChange({ ...profile, [key]: value });
  const numeric = (key: keyof Profile, label: ScenarioKey, min = 0, max = 100, fallback = 0) =>
    <InputField label={s(label)} value={Number(profile[key] ?? fallback)} min={min} max={max} onChange={value => set(key, value)} onDraftValidityChange={setDraftInvalid} />;
  const toggle = (key: keyof Profile, label: ScenarioKey) => <label className="touch-choice"><input type="checkbox"
    checked={!!profile[key]} onChange={event => set(key, event.target.checked)} />{s(label)}</label>;
  const optional = (key: 'invulnerableSave' | 'fnpThreshold', label: ScenarioKey) => <label>{s(label)}<select style={scenarioInput}
    value={profile[key] ?? ''} onChange={event => set(key, event.target.value ? Number(event.target.value) : undefined)}>
    <option value="">—</option>{[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}+</option>)}</select></label>;
  const unitId = side === 'attacker' ? base.catalogSelection?.attackerUnitId : base.catalogSelection?.defenderUnitId;
  const variants = catalog?.miniatures.filter(m => m.unitId === unitId) ?? [];
  const miniatureId = side === 'attacker' ? profile.catalogSelection?.attackerMiniatureId : profile.catalogSelection?.defenderMiniatureId;
  const weaponIds = catalog?.equipmentChoices.filter(c => c.miniatureId === miniatureId).flatMap(c => c.weaponIds) ?? [];
  const modes = catalog?.weaponModes.filter(m => weaponIds.includes(m.weaponId) && m.type === (base.attackType ?? 'ranged')) ?? [];
  function select(miniature: string, mode?: string) {
    if (!catalog || !base.catalogSelection) return;
    const selection = { ...base.catalogSelection, ...(side === 'attacker' ? { attackerMiniatureId: miniature, modeId: mode } : { defenderMiniatureId: miniature }) };
    try {
      const reset = side === 'defender' ? { targetWounds: Number(catalog.miniatures.find(m => m.id === miniature)?.characteristics.woundsMax.normalized) } : {};
      const review = resolveCatalogScenario(catalog, selection, { ...individualProfile(profile), ...reset });
      onChange({ ...review.params, catalogSelection: selection, calculationBlocked: false });
    } catch { onChange({ ...profile, catalogSelection: selection, calculationBlocked: true }); }
  }
  if (entryMode === 'catalog') return <div className="squad-profile">
    <label>{s('miniature')}<select style={scenarioInput} value={miniatureId ?? ''} onChange={event => {
      const ids = catalog?.equipmentChoices.filter(c => c.miniatureId === event.target.value).flatMap(c => c.weaponIds) ?? [];
      const next = catalog?.weaponModes.filter(m => ids.includes(m.weaponId) && m.type === (base.attackType ?? 'ranged')) ?? [];
      select(event.target.value, next.length === 1 ? next[0].id : undefined);
    }}><option value="">{s('select')}</option>{variants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
    {side === 'attacker' && <label>{s('mode')}<select style={scenarioInput} value={profile.catalogSelection?.modeId ?? ''}
      onChange={event => select(miniatureId ?? '', event.target.value || undefined)}><option value="">{s('select')}</option>
      {modes.map(m => <option key={m.id} value={m.id}>{catalog?.weapons.find(w => w.id === m.weaponId)?.name} · {m.name}</option>)}</select></label>}
    {side === 'defender' && numeric('targetWounds', 'wounds', 1, profile.woundsMax ?? 500, profile.targetWounds)}
    {side === 'attacker' && <p>{s('attacks')}: {profile.attacksExpression} · {s('damage')}: {profile.damageExpression}</p>}
    {side === 'attacker' && <WeaponContext profile={profile} onChange={onChange} />}
  </div>;
  return <div className="squad-profile"><div className="scenario-columns">
    {side === 'attacker' ? <>
      <label>{s('attacks')}<input style={scenarioInput} value={profile.attacksExpression ?? (profile.attacksD6 ? 'D6' : profile.attacks)} onChange={event => set('attacksExpression', event.target.value)} /></label>
      {numeric('hitThreshold', 'skill', 2, 6)}{numeric('strength', 'strength', 1)}
      <label>{s('ap')}<input type="number" style={scenarioInput} min={-100} max={0} value={-profile.ap} onChange={event => set('ap', event.target.value === '' ? NaN : -Number(event.target.value))} /></label>
      <label>{s('damage')}<input style={scenarioInput} value={profile.damageExpression ?? (profile.damageD6 ? 'D6' : profile.damage)} onChange={event => set('damageExpression', event.target.value)} /></label>
    </> : <>
      {numeric('toughness', 'toughness', 1)}{numeric('woundsMax', 'maxWounds', 1, 100, profile.targetWounds)}
      {numeric('targetWounds', 'wounds', 1, profile.woundsMax ?? 100)}{numeric('baseSave', 'save', 2, 6)}
      {optional('invulnerableSave', 'invul')}{optional('fnpThreshold', 'fnp')}
    </>}
  </div>{side === 'attacker' && <details><summary>{s('advanced')}</summary><div className="scenario-columns">
    {numeric('damageBonus', 'damageBonus')}{numeric('hitModifier', 'hitModifier', -100)}{numeric('woundModifier', 'woundModifier', -100)}
    {numeric('sustainedHits', 'sustained', 0, 10)}{numeric('rapidFire', 'rapidFire')}{numeric('melta', 'melta')}
  </div>{toggle('torrent', 'torrent')}{toggle('lethalHits', 'lethal')}{toggle('devastatingWounds', 'devastating')}{toggle('heavy', 'heavy')}
    {toggle('ignoresCover', 'ignoresCover')}<p>{s('rerollPermission')}</p>
    <label>{s('hitRerollAll')}<select style={scenarioInput} value={profile.hitRerollNonSixes ? 'nonSixes' : profile.hitRerollAll ? 'failures' : 'none'}
      onChange={event => onChange({ ...profile, hitRerollAll: event.target.value === 'failures', hitRerollNonSixes: event.target.value === 'nonSixes' })}>
      <option value="none">—</option><option value="failures">{s('hitRerollAll')}</option><option value="nonSixes">{s('hitRerollNonSixes')}</option></select></label>
    <label>{s('woundRerollAll')}<select style={scenarioInput} value={profile.woundRerollNonSixes ? 'nonSixes' : profile.woundRerollAll ? 'failures' : 'none'}
      onChange={event => onChange({ ...profile, woundRerollAll: event.target.value === 'failures', woundRerollNonSixes: event.target.value === 'nonSixes' })}>
      <option value="none">—</option><option value="failures">{s('woundRerollAll')}</option><option value="nonSixes">{s('woundRerollNonSixes')}</option></select></label>
    {profile.lethalHits && <label>{s('lethalChoice')}<select style={scenarioInput} value={profile.lethalChoice ?? 'autoWound'} onChange={event => set('lethalChoice', event.target.value as 'autoWound' | 'rollToWound')}>
      <option value="autoWound">{s('autoWound')}</option><option value="rollToWound">{s('rollWound')}</option></select></label>}
    <WeaponContext profile={profile} onChange={onChange} />
  </details>}</div>;
}

function WeaponContext({ profile, onChange }: { profile: Profile; onChange: (next: Profile) => void }) {
  const choices = (key: 'withinHalfRange' | 'engaged' | 'setUpThisTurn' | 'movedOverThree', label: ScenarioKey) =>
    <label>{s(label)}<select style={scenarioInput} value={profile[key] === undefined ? '' : String(profile[key])}
      onChange={event => onChange({ ...profile, [key]: event.target.value === '' ? undefined : event.target.value === 'true' })}>
      <option value="">{s('select')}</option><option value="true">{s('yes')}</option><option value="false">{s('no')}</option></select></label>;
  return <div>{((profile.rapidFire ?? 0) > 0 || (profile.melta ?? 0) > 0) && choices('withinHalfRange', 'halfRange')}
    {profile.heavy && <><label>{s('phase')}<select style={scenarioInput} value={profile.phase ?? ''} onChange={event => onChange({ ...profile, phase: event.target.value as 'shooting' | 'fight' })}>
      <option value="">{s('select')}</option><option value="shooting">{s('shooting')}</option><option value="fight">{s('fight')}</option></select></label>
      {choices('engaged', 'engaged')}{choices('setUpThisTurn', 'arrived')}{choices('movedOverThree', 'moved')}</>}
  </div>;
}

export function SquadScenarioControls({ params, onChange }: Props) {
  const seed = useId(); const attackers = params.attackerEquipmentGroups ?? []; const defenders = params.defenderGroups ?? [];
  const primaryCount = (params.modelCount ?? 1) - attackers.reduce((sum, g) => sum + g.count, 0);
  const primaryDefenders = (params.targetModelCount ?? 1) - defenders.reduce((sum, g) => sum + g.count, 0);
  const profile = () => individualProfile(params);
  const key = () => `${seed}-${Date.now()}-${attackers.length}-${defenders.length}`;
  function weaponList(weapons: Profile[], change: (weapons: Profile[]) => void, primary = false) {
    return <div>{weapons.map((w, i) => <div className="squad-weapon" key={i}><h4>{s('weapon')} {i + (primary ? 2 : 1)}</h4>
      <ProfileEditor profile={w} base={params} side="attacker" onChange={next => change(weapons.map((old, index) => index === i ? next : old))} />
      <div className="entry-options">{(primary || weapons.length > 1) && <button type="button" onClick={() => change(weapons.filter((_, index) => index !== i))}>{s('removeWeapon')}</button>}
        {(i > 0 || primary) && <button type="button" onClick={() => {
          const next = [...weapons];
          if (primary && i === 0) { next[0] = individualProfile(params); onChange({ ...replacePrimaryProfile(params, w, 'attacker'), primaryExtraWeapons: next }); }
          else { [next[i - 1], next[i]] = [next[i], next[i - 1]]; change(next); }
        }}>{s('earlier')}</button>}</div>
    </div>)}<div className="entry-options"><button type="button" disabled={weapons.length >= (primary ? 4 : 5)} onClick={() => change([...weapons, profile()])}>{s('addWeaponToGroup')}</button></div></div>;
  }
  return <details style={scenarioPanel}><summary>{s('squadEquipment')}</summary><p>{s('equipmentHelp')}</p><p className="scenario-caption">{s('identicalAttacksHelp')}</p>
    <p>{s('primaryGroup')} {primaryCount} {s('modelsWord')}</p>
    {weaponList(params.primaryExtraWeapons ?? [], next => onChange({ ...params, primaryExtraWeapons: next }), true)}
    {attackers.map((group, i) => <fieldset key={group.id} style={scenarioPanel}><legend>{s('attackerGroup')} {i + 2}</legend>
      <SquadCounter label={s('groupModels')} value={group.count} max={99} onChange={count => onChange({ ...params, attackerEquipmentGroups: attackers.map(g => g.id === group.id ? { ...g, count } : g) })} />
      {weaponList(group.weapons, weapons => onChange({ ...params, attackerEquipmentGroups: attackers.map(g => g.id === group.id ? { ...g, weapons } : g) }))}
      <div className="entry-options"><button type="button" onClick={() => onChange({ ...params, attackerEquipmentGroups: attackers.filter(g => g.id !== group.id) })}>{s('removeGroup')}</button>
        <button type="button" onClick={() => {
          const next = [...attackers];
          if (i === 0) {
            next[0] = { ...group, count: primaryCount, weapons: [individualProfile(params), ...(params.primaryExtraWeapons ?? [])] };
            onChange({ ...replacePrimaryProfile(params, group.weapons[0], 'attacker'), primaryExtraWeapons: group.weapons.slice(1), attackerEquipmentGroups: next });
          } else { [next[i - 1], next[i]] = [next[i], next[i - 1]]; onChange({ ...params, attackerEquipmentGroups: next }); }
        }}>{s('earlier')}</button></div>
    </fieldset>)}
    <div className="entry-options"><button type="button" disabled={attackers.length >= 9} onClick={() => onChange({ ...params,
      modelCount: Math.max(params.modelCount ?? 1, attackers.reduce((sum, g) => sum + g.count, 0) + 2),
      attackerEquipmentGroups: [...attackers, { id: key(), count: 1, weapons: [profile()] }] })}>{s('addEquipmentGroup')}</button></div>
    <p>{s('allocationHelp')}</p><p>{s('primaryGroup')} {primaryDefenders} {s('modelsWord')}</p>
    <label className="touch-choice"><input type="checkbox" checked={!!params.primaryIsCharacter} onChange={event => onChange({ ...params, primaryIsCharacter: event.target.checked })} />{s('primaryCharacter')}</label>
    {defenders.map((group, i) => <fieldset key={group.id} style={scenarioPanel}><legend>{s('defenderGroup')} {i + 2}</legend>
      <SquadCounter label={s('groupModels')} value={group.count} max={group.isCharacter ? 1 : 99} onChange={count => onChange({ ...params, defenderGroups: defenders.map(g => g.id === group.id ? { ...g, count } : g) })} />
      <ProfileEditor profile={group.profile} base={params} side="defender" onChange={next => onChange({ ...params, defenderGroups: defenders.map(g => g.id === group.id ? { ...g, profile: next } : g) })} />
      <label className="touch-choice"><input type="checkbox" checked={!!group.isCharacter} onChange={event => onChange({ ...params, defenderGroups: defenders.map(g => g.id === group.id ? { ...g, isCharacter: event.target.checked } : g) })} />{s('character')}</label>
      <div className="entry-options"><button type="button" onClick={() => onChange({ ...params, defenderGroups: defenders.filter(g => g.id !== group.id) })}>{s('removeGroup')}</button>
        <button type="button" onClick={() => {
          const next = [...defenders];
          if (i === 0) {
            next[0] = { ...group, count: primaryDefenders, profile: individualProfile(params), isCharacter: params.primaryIsCharacter };
            onChange({ ...replacePrimaryProfile(params, group.profile, 'defender'), primaryIsCharacter: group.isCharacter, defenderGroups: next });
          } else { [next[i - 1], next[i]] = [next[i], next[i - 1]]; onChange({ ...params, defenderGroups: next }); }
        }}>{s('earlier')}</button></div>
    </fieldset>)}
    <div className="entry-options"><button type="button" disabled={defenders.length >= 9} onClick={() => onChange({ ...params,
      targetModelCount: Math.max(params.targetModelCount ?? 1, defenders.reduce((sum, g) => sum + g.count, 0) + 2),
      defenderGroups: [...defenders, { id: key(), count: 1, profile: { ...profile(), targetWounds: params.woundsMax ?? params.targetWounds } }] })}>{s('addDefenderGroup')}</button></div>
  </details>;
}
