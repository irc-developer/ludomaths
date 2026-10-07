import { CatalogPanel } from '../../catalog/CatalogPanel';
import { useCatalogInput } from '../../catalog/CatalogContext';
import { useCombatScenario } from './CombatScenarioContext';
import { useId } from 'react';
import { InputField } from '../../components/InputField';
import { NumberInput } from '../../components/NumberInput';
import { RerollControls } from './RerollControls';
import { updateRerollSelection } from './rerollPolicy';
import { WH40K_PRESETS, type CombatParams } from './presets';
import { s, type ScenarioKey } from '../../i18n/scenario';
import { scenarioInput, scenarioPanel } from './scenarioStyles';
import { SquadCounter, SquadScenarioControls } from './SquadScenarioControls';
import { isSquadScenario } from '@application/dice/squadScenario';

interface Props { params: CombatParams; onChange: (params: CombatParams) => void; individualAttacks?: boolean }
/** All three calculators edit the same scenario; required context stays outside disclosures. */
export function CombatScenarioForm({ params: input, onChange, individualAttacks }: Props) {
  const id = useId();
  const { entryMode, setEntryMode, setDraftInvalid } = useCombatScenario();
  const params = useCatalogInput(input);
  const squadMode = isSquadScenario(params);
  const manual = entryMode === 'manual';
  const selectedWeapon = !!params.catalogSelection?.modeId;
  const selectedTarget = !!params.catalogSelection?.defenderMiniatureId;
  const needsRange = (params.rapidFire ?? 0) > 0 || (params.melta ?? 0) > 0;
  const missingContext = needsRange && params.withinHalfRange === undefined || !!params.heavy &&
    (!params.phase || params.engaged === undefined || params.setUpThisTurn === undefined || params.movedOverThree === undefined);
  const set = <K extends keyof CombatParams>(key: K, value: CombatParams[K]) => onChange({ ...params, [key]: value });
  const numeric = (key: keyof CombatParams, label: ScenarioKey, min: number, max: number, fallback = 0) =>
    <InputField label={s(label)} value={Number(params[key] ?? fallback)} min={min} max={max} onChange={value => set(key, value)} onDraftValidityChange={setDraftInvalid} />;
  const toggle = (key: keyof CombatParams, label: ScenarioKey) => <label className="touch-choice">
    <input type="checkbox" checked={!!params[key]} onChange={event => set(key, event.target.checked)} />{s(label)}
  </label>;
  const optional = (key: 'invulnerableSave' | 'fnpThreshold' | 'sustainedHits', label: ScenarioKey, valueLabel: ScenarioKey, fallback: number) =>
    <div className="optional-number"><label className="touch-choice"><input type="checkbox" checked={params[key] !== undefined}
      onChange={event => set(key, event.target.checked ? fallback : undefined)} />{s(label)}</label>
      {params[key] !== undefined && <NumberInput compact aria-label={s(valueLabel)} min={key === 'sustainedHits' ? 1 : 2}
        max={key === 'sustainedHits' ? 10 : 6} value={params[key]!} onChange={value => set(key, value)} onDraftValidityChange={setDraftInvalid} />}
    </div>;
  const activeAdjustments = !!(params.damageBonus || params.hitModifier || params.woundModifier || params.hitRerollAll ||
    params.hitRerollNonSixes || params.woundRerollAll || params.woundRerollNonSixes);
  function changeEntry(next: 'catalog' | 'manual') {
    if (next === entryMode) return;
    setEntryMode(next);
    const manualProfile = (profile: CombatParams) => ({ ...profile, catalogSelection: undefined, calculationBlocked: false });
    onChange({ ...params, catalogSelection: undefined, partialCalculation: false, calculationBlocked: false, calculationLimitations: [],
      primaryExtraWeapons: next === 'manual' ? params.primaryExtraWeapons?.map(manualProfile) : [],
      attackerEquipmentGroups: next === 'manual' ? params.attackerEquipmentGroups?.map(g => ({ ...g, weapons: g.weapons.map(manualProfile) })) : [],
      defenderGroups: next === 'manual' ? params.defenderGroups?.map(g => ({ ...g, profile: manualProfile(g.profile) })) : [] });
  }
  return <div className="combat-scenario">
    <div className="entry-options" aria-label={s('type')}>
      <button aria-pressed={!manual} onClick={() => changeEntry('catalog')}>{s('catalogEntry')}</button>
      <button aria-pressed={manual} onClick={() => changeEntry('manual')}>{s('manual')}</button>
    </div>
    <CatalogPanel params={input} onChange={onChange} />
    <div className="scenario-columns" style={scenarioPanel}>
      <SquadCounter label={s('attackingModels')} value={params.modelCount ?? 1} onChange={value => set('modelCount', value)} />
      <SquadCounter label={s('defendingModels')} value={params.targetModelCount ?? 1} onChange={value => onChange({ ...params,
        targetModelCount: value, casualtyGoal: Math.min(params.casualtyGoal ?? value, value) })} />
    </div>
    {manual ? <>
      <p className="scenario-caption">{s('manualNotice')}</p>
      <details style={scenarioPanel}><summary>{s('example')}</summary>
        <label>{s('example')}<select style={scenarioInput} value="custom" onChange={event => {
          const preset = WH40K_PRESETS.find(example => example.id === event.target.value);
          if (preset) onChange({ ...preset.params, woundsMax: preset.params.targetWounds });
        }}><option value="custom">{s('custom')}</option>{WH40K_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
      </details>
      <div className="scenario-columns">
        <fieldset style={scenarioPanel}><legend>{s('weapon')}</legend>
          <label>{s('type')}<select style={scenarioInput} value={params.attackType ?? 'ranged'} onChange={event => set('attackType', event.target.value as 'ranged' | 'melee')}>
            <option value="ranged">{s('ranged')}</option><option value="melee">{s('melee')}</option></select></label>
          {!individualAttacks && <>
            <label>{s('attacks')}<input style={scenarioInput} value={params.attacksExpression ?? (params.attacksD6 ? 'D6' : params.attacks)}
              onChange={event => set('attacksExpression', event.target.value)} /></label></>}
          {!params.torrent && numeric('hitThreshold', 'skill', 2, 6)}{numeric('strength', 'strength', 1, 100)}
          <label>{s('ap')}<input type="number" style={scenarioInput} value={params.ap === 0 ? 0 : -params.ap} min={-100} max={0}
            onChange={event => set('ap', event.target.value === '' ? NaN : -Number(event.target.value))} /></label>
          <label>{s('damage')}<input style={scenarioInput} value={params.damageExpression ?? (params.damageD6 ? 'D6' : params.damage)}
            onChange={event => set('damageExpression', event.target.value)} /></label>
          <small>{s('expressionHelp')}</small>
        </fieldset>
        <fieldset style={scenarioPanel}><legend>{s(squadMode ? 'primaryDefender' : 'target')}</legend>
          {squadMode && <p className="scenario-caption">{s('modelWoundsHelp')}</p>}
          {numeric('toughness', 'toughness', 1, 100)}{numeric('woundsMax', 'maxWounds', 1, 500, params.targetWounds)}
          {numeric('targetWounds', 'wounds', 1, 500)}{numeric('baseSave', 'save', 2, 6)}
          {optional('invulnerableSave', 'invul', 'invulValue', 4)}{optional('fnpThreshold', 'fnp', 'fnpValue', 5)}
        </fieldset>
      </div>
    </> : <>
      {(selectedWeapon || selectedTarget) && <div className="scenario-columns" style={scenarioPanel}>
        {selectedTarget && <div>{squadMode && <p className="scenario-caption">{s('modelWoundsHelp')}</p>}{numeric('targetWounds', 'wounds', 1, params.woundsMax ?? 500)}
          <small>{s('maxWounds')}: {params.woundsMax}</small></div>}
      </div>}
      {(selectedWeapon || selectedTarget) && <details style={scenarioPanel}><summary>{s('characteristics')}</summary>
        {selectedWeapon && <p>{s('attacks')}: {params.attacksExpression} · {s('skill')}: {params.torrent ? s('torrent') : `${params.hitThreshold}+`} · {s('strength')}: {params.strength} · {s('apShort')} {params.ap === 0 ? 0 : -params.ap} · {s('damage')}: {params.damageExpression}</p>}
        {selectedTarget && <p>{s('toughness')}: {params.toughness} · {s('save')}: {params.baseSave}+ · {s('maxWounds')}: {params.woundsMax}
          {params.invulnerableSave !== undefined && ` · ${s('invul')}: ${params.invulnerableSave}++`}</p>}
        <ul>{(['torrent', 'devastatingWounds', 'heavy', 'rapidFire'] as const).filter(key => params[key]).map(key => <li key={key}>{s(key === 'devastatingWounds' ? 'devastating' : key)}{key === 'rapidFire' && ` ${params.rapidFire}`}</li>)}</ul>
      </details>}
    </>}
    {squadMode && params.partialCalculation && <div className="scope-notice"><p>{s('profilePartialNotice')}</p>
      <details><summary>{s('pendingDetails')}</summary><ul>{params.calculationLimitations?.map(message => <li key={message}>{message}</li>)}</ul></details>
      <label className="touch-choice"><input type="checkbox" checked={JSON.stringify(params.acceptedSquadOmissions ?? []) === JSON.stringify(params.calculationLimitations ?? [])}
        onChange={event => onChange({ ...params, acceptedSquadOmissions: event.target.checked ? params.calculationLimitations : [] })} />{s('acceptSquadPartial')}</label>
    </div>}
    {(manual || params.catalogSelection?.attackerMiniatureId || selectedTarget) && <SquadScenarioControls params={params} onChange={onChange} />}
    {(manual || selectedWeapon) && <>
      {((params.attackType ?? 'ranged') === 'ranged' && !params.ignoresCover || params.heavy || (params.rapidFire ?? 0) > 0 || (params.melta ?? 0) > 0 || params.lethalHits) &&
        <fieldset style={scenarioPanel}><legend>{s('situation')}</legend>
          {missingContext && <p id={`${id}-context-help`} className="scenario-caption">{s('contextRequired')}</p>}
          {(params.attackType ?? 'ranged') === 'ranged' && !params.ignoresCover && toggle('cover', 'cover')}
          {((params.rapidFire ?? 0) > 0 || (params.melta ?? 0) > 0) && <label>{s('halfRange')}
            <select style={scenarioInput} aria-invalid={params.withinHalfRange === undefined} aria-describedby={missingContext ? `${id}-context-help` : undefined} value={params.withinHalfRange === undefined ? '' : String(params.withinHalfRange)} onChange={event => set('withinHalfRange', event.target.value === '' ? undefined : event.target.value === 'true')}>
              <option value="">{s('select')}</option><option value="true">{s('yes')}</option><option value="false">{s('outsideHalfRange')}</option></select></label>}
          {params.heavy && <>
            <label>{s('phase')}<select style={scenarioInput} aria-invalid={!params.phase} aria-describedby={missingContext ? `${id}-context-help` : undefined} value={params.phase ?? ''} onChange={event => set('phase', event.target.value as 'shooting' | 'fight')}>
              <option value="">{s('select')}</option><option value="shooting">{s('shooting')}</option><option value="fight">{s('fight')}</option></select></label>
            {(['engaged', 'setUpThisTurn', 'movedOverThree'] as const).map((key, index) => <label key={key}>{s((['engaged', 'arrived', 'moved'] as const)[index])}
              <select style={scenarioInput} aria-invalid={params[key] === undefined} aria-describedby={missingContext ? `${id}-context-help` : undefined} value={params[key] === undefined ? '' : String(params[key])} onChange={event => set(key, event.target.value === '' ? undefined : event.target.value === 'true')}>
                <option value="">{s('select')}</option><option value="true">{s('yes')}</option><option value="false">{s('no')}</option></select></label>)}
          </>}
          {params.lethalHits && <label>{s('lethalChoice')}<select style={scenarioInput} value={params.lethalChoice ?? 'autoWound'} onChange={event => set('lethalChoice', event.target.value as 'autoWound' | 'rollToWound')}>
            <option value="autoWound">{s('autoWound')}</option><option value="rollToWound">{s('rollWound')}</option></select></label>}
        </fieldset>}
      {activeAdjustments && <p className="scope-notice">{s('activeAdjustments')}</p>}
      <details style={scenarioPanel}><summary>{s('advanced')}</summary>
        <div className="scenario-columns">{numeric('damageBonus', 'damageBonus', 0, 100)}
          {numeric('hitModifier', 'hitModifier', -100, 100)}{numeric('woundModifier', 'woundModifier', -100, 100)}</div>
        <p>{s('rerollPermission')}</p>
        <RerollControls idPrefix={id} stage="hit" failures={params.hitRerollAll} nonSixes={params.hitRerollNonSixes} disabled={params.torrent}
          onChange={(choice, checked) => onChange(updateRerollSelection(params, 'hit', choice, checked))} />
        <RerollControls idPrefix={id} stage="wound" failures={params.woundRerollAll} nonSixes={params.woundRerollNonSixes}
          onChange={(choice, checked) => onChange(updateRerollSelection(params, 'wound', choice, checked))} />
        {manual && <details><summary>{s('rules')}</summary><div className="manual-abilities">
          {toggle('torrent', 'torrent')}{optional('sustainedHits', 'sustained', 'sustainedValue', 1)}
          {toggle('lethalHits', 'lethal')}{toggle('devastatingWounds', 'devastating')}
          {toggle('ignoresCover', 'ignoresCover')}{toggle('twinLinked', 'twinLinked')}
          {numeric('rapidFire', 'rapidFire', 0, 100)}{numeric('melta', 'melta', 0, 100)}{toggle('heavy', 'heavy')}
        </div></details>}
      </details>
    </>}
  </div>;
}
