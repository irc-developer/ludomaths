import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ProfileCatalog } from '@domain/profiles/catalog';
import { isSquadScenario } from '@application/dice/squadScenario';
import { useCatalog } from '../../catalog/CatalogContext';
import { useNumberDrafts } from '../../components/NumberDrafts';
import { s, type ScenarioKey } from '../../i18n/scenario';
import { useCombatScenario } from './CombatScenarioContext';
import type { CombatParams } from './presets';
import type { CombatMode } from './AttackSetupScreen';
import { WizardScreen, type WizardError } from './WizardScreen';
import { orderReviewDefenders, validateReview } from './wizardValidation';

const yesNo = (value: boolean | undefined) => value === undefined ? '—' : s(value ? 'wizardYes' : 'wizardNo');
const signed = (value: number) => value > 0 ? `+${value}` : String(value);
function weaponContexts(p: CombatParams): string[] {
  const lines: string[] = [];
  const ranged = p.attackType !== 'melee';
  if (ranged && ((p.rapidFire ?? 0) > 0 || (p.melta ?? 0) > 0)) lines.push(`${s('halfRange')}: ${yesNo(p.withinHalfRange)}`);
  if (ranged && p.heavy) {
    lines.push(`${s('phase')}: ${p.phase ? s(p.phase) : '—'}`);
    for (const [key, label] of [['engaged', 'engaged'], ['setUpThisTurn', 'arrived'], ['movedOverThree', 'moved']] as const)
      lines.push(`${s(label)}: ${yesNo(p[key])}`);
  }
  if (p.lethalHits) lines.push(`${s('lethalChoice')}: ${s(p.lethalChoice === 'rollToWound' ? 'rollWound' : 'autoWound')}`);
  return lines;
}
function weaponConditions(p: CombatParams): string[] {
  const lines: string[] = [];
  for (const [key, label] of [['hitModifier', 'hitModifier'], ['woundModifier', 'woundModifier'], ['damageBonus', 'damageBonus']] as const)
    if (p[key]) lines.push(`${s(label)}: ${signed(p[key]!)}`);
  const flags: [keyof CombatParams, ScenarioKey][] = [
    ['torrent', 'torrent'], ['ignoresCover', 'ignoresCover'], ['heavy', 'heavy'], ['twinLinked', 'twinLinked'],
    ['lethalHits', 'lethal'], ['devastatingWounds', 'devastating'],
    ['guaranteedHitSix', 'sixHit'], ['guaranteedWoundSix', 'sixWound'], ['guaranteedDamageSix', 'sixDamage'],
  ];
  for (const [key, label] of flags) if (p[key]) lines.push(s(label));
  if (!p.torrent) {
    if (p.hitRerollNonSixes) lines.push(s('hitRerollNonSixes'));
    else if (p.hitRerollAll) lines.push(s('hitRerollAll'));
  }
  if (p.woundRerollNonSixes) lines.push(s('woundRerollNonSixes'));
  else if (p.woundRerollAll) lines.push(s('woundRerollAll'));
  for (const [key, label] of [['rapidFire', 'rapidFire'], ['melta', 'melta'], ['sustainedHits', 'sustainedValue'], ['mortalWoundsPerHit', 'mortal']] as const)
    if (p[key]) lines.push(`${s(label)}: ${p[key]}`);
  return lines;
}
function profileName(catalog: ProfileCatalog | null, p: CombatParams, side: 'attacker' | 'defender', fallback: string) {
  const id = side === 'attacker' ? p.catalogSelection?.attackerMiniatureId : p.catalogSelection?.defenderMiniatureId;
  return catalog?.miniatures.find(m => m.id === id)?.name ?? fallback;
}
function ReviewCard({ title, action, onEdit, children, wide = false }: { title: string; action: string; onEdit: () => void; children: ReactNode; wide?: boolean }) {
  return <section className={`wizard-review-card${wide ? ' wizard-review-wide' : ''}`} aria-label={title}>
    <header><h3>{title}</h3><button type="button" className="wizard-text-button" onClick={onEdit}>{action}</button></header>{children}
  </section>;
}

export function ReviewSetupScreen({ mode }: { mode: CombatMode }) {
  const { params: input, setParams, entryMode, successPercent, setWizardStep, attackerCountDraft, woundedDefenderId,
    manualAttackerName, manualDefenderName, setConfirmedScenario, attackModes } = useCombatScenario();
  const { catalog, loading } = useCatalog();
  const { pending, drafts } = useNumberDrafts();
  const [submitted, setSubmitted] = useState(0);
  const generating = useRef(false);
  const review = validateReview(catalog, input, entryMode, mode, successPercent, attackerCountDraft, woundedDefenderId);
  const params = review.params;
  const issues: WizardError[] = [...review.issues, ...Object.entries(pending)
    .filter(([key]) => drafts[key] !== undefined && (mode === 'required' || !key.startsWith('attack/objective/')))
    .map(([key, field]) => ({ step: key.startsWith('defender/') ? 2 : 3, message: `${field.label}: ${s('invalidInput')}` }))];
  const limitations = params.calculationLimitations ?? [];
  const partial = !!params.partialCalculation && limitations.length > 0;
  const squad = isSquadScenario(params);
  const accepted = JSON.stringify(params.acceptedSquadOmissions ?? []) === JSON.stringify(limitations);
  const omissionKey = JSON.stringify(limitations);
  const acceptanceKey = JSON.stringify(input.acceptedSquadOmissions ?? []);
  useEffect(() => {
    if (acceptanceKey !== '[]' && acceptanceKey !== omissionKey) setParams(old => ({ ...old, acceptedSquadOmissions: [] }));
  }, [acceptanceKey, omissionKey, setParams]);
  const errors = [...issues];
  if (partial && squad && !accepted && submitted) errors.push({ target: 'wizard-review-omissions', message: s('wizardAcceptRequired') });
  const attackerName = entryMode === 'manual' ? manualAttackerName.trim() || s('wizardManualAttacker') :
    catalog?.units.find(u => u.id === params.catalogSelection?.attackerUnitId)?.name ?? '—';
  const defenderName = entryMode === 'manual' ? manualDefenderName.trim() || s('wizardManualDefender') :
    catalog?.units.find(u => u.id === params.catalogSelection?.defenderUnitId)?.name ?? '—';
  const composition = catalog?.compositions.find(c => c.id === params.catalogSelection?.attackerCompositionId);
  const initial = params.squadEquipment?.initialModelCount ?? composition?.members.reduce((sum, m) => sum + m.min, 0);
  const attackerGroups = [{ id: 'primary', count: (params.modelCount ?? 1) - (params.attackerEquipmentGroups ?? []).reduce((sum, g) => sum + g.count, 0),
    weapons: [params, ...(params.primaryExtraWeapons ?? [])] }, ...(params.attackerEquipmentGroups ?? [])];
  const defenders = [{ id: 'primary', count: (params.targetModelCount ?? 1) - (params.defenderGroups ?? []).reduce((sum, g) => sum + g.count, 0),
    profile: params, isCharacter: params.primaryIsCharacter }, ...(params.defenderGroups ?? [])];
  const orderedDefenders = orderReviewDefenders(defenders.map((g, index) => ({ ...g, index })));
  const searchUnit = !squad ? 'attacks' : params.requiredSquadUnit ?? 'attacks';
  const sharedContexts = params.squadEquipment ? [...new Set(attackerGroups.flatMap(g => g.weapons.flatMap(weaponContexts)))] : [];
  function generate() {
    if (generating.current) return;
    setSubmitted(n => n + 1);
    // Re-resolve at the action boundary; never confirm the last valid numeric value of an incomplete field.
    const latest = validateReview(catalog, input, entryMode, mode, successPercent, attackerCountDraft, woundedDefenderId);
    const omitted = latest.params.calculationLimitations ?? [];
    if (latest.issues.length || issues.length || latest.params.partialCalculation && isSquadScenario(latest.params) &&
      JSON.stringify(latest.params.acceptedSquadOmissions ?? []) !== JSON.stringify(omitted)) return;
    generating.current = true;
    setConfirmedScenario(structuredClone({ params: latest.params, mode, successPercent, attackerName, defenderName, entryMode, woundedDefenderId, attackModes, manualAttackerName, manualDefenderName }));
    setParams(latest.params); setWizardStep(5);
  }
  return <WizardScreen step={4} title={s('wizardReviewTitle')} help={s('wizardReviewHelp')} errors={errors}
    submitted={submitted || issues.length > 0} onBack={() => setWizardStep(3)} onContinue={generate}
    action={s('wizardGenerate')} disabled={entryMode === 'catalog' && loading}>
    <section className="wizard-review-scope" aria-label={s('wizardReportType')}>
      <p className="wizard-eyebrow">{s('wizardReportType')}</p>
      <h3>{s(mode === 'required' ? 'requiredTitle' : mode === 'buffs' ? 'buffsTab' : 'combatTab')}</h3>
      <div className="wizard-review-tags"><span>{s((params.targetModelCount ?? 1) > 1 || params.defenderGroups?.length ? 'wizardSquadTarget' : 'wizardSingleTarget')}</span>
        <span>{s(params.attackType === 'melee' ? 'melee' : 'ranged')}</span>{partial && <span>{s('partialResult')}</span>}</div>
      <p>{s(mode === 'required' ? squad ? 'inverseSquadHelp' : 'inverseScope' : mode === 'buffs' ? 'wizardBuffScope' : 'wizardOneActivation')}</p>
    </section>
    <div className="wizard-review-grid">
      <ReviewCard title={s('attacker')} action={s('wizardChangeAttacker')} onEdit={() => setWizardStep(1)}>
        <h4>{attackerName}</h4><dl className="wizard-review-facts">
          {initial !== undefined && <div><dt>{s('wizardComposition')}</dt><dd>{initial}</dd></div>}
          <div><dt>{s('wizardParticipating')}</dt><dd>{params.modelCount ?? 1}</dd></div>
        </dl>
        {composition && <ul className="wizard-members">{composition.members.map(m => <li key={m.miniatureId}>
          <span>{catalog?.miniatures.find(v => v.id === m.miniatureId)?.name}</span><strong>{m.min}</strong></li>)}</ul>}
        {!composition && <p>{profileName(catalog, params, 'attacker', s('wizardManualAttacker'))}</p>}
      </ReviewCard>
      <ReviewCard title={s('defender')} action={s('wizardChangeDefender')} onEdit={() => setWizardStep(2)}>
        <h4>{defenderName}</h4><dl className="wizard-review-facts"><div><dt>{s('defendingModels')}</dt><dd>{params.targetModelCount ?? 1}</dd></div></dl>
        <p className="wizard-eyebrow">{s('wizardAllocationOrder')}</p>
        <ol className="wizard-review-list">{orderedDefenders.map(g => <li key={g.id}>
          <strong>{g.count} × {profileName(catalog, g.profile, 'defender', g.index === 0 ? s('primaryDefender') : `${s('defenderGroup')} ${g.index + 1}`)}</strong>
          {g.isCharacter && <span className="wizard-review-character">{s('wizardCharacter')}</span>}
          {!!g.profile.damageReduction && <p>{s('damageReduction')}: −{g.profile.damageReduction}</p>}
          <p>{g.profile.targetWounds < (g.profile.woundsMax ?? g.profile.targetWounds) ?
            `${s('wizardWoundedReview')} ${g.profile.targetWounds} ${s(g.profile.targetWounds === 1 ? 'wizardWoundOf' : 'wizardWoundsOf')} ${g.profile.woundsMax}.` : s('wizardFullWounds')}</p>
          <details><summary>{s('wizardDefenses')}</summary><p>R {g.profile.toughness} · Sv {g.profile.baseSave}+ · H {g.profile.woundsMax ?? g.profile.targetWounds}
            {g.profile.invulnerableSave !== undefined && ` · ${s('invul')}: ${g.profile.invulnerableSave}++`}
            {g.profile.fnpThreshold !== undefined && ` · FNP ${g.profile.fnpThreshold}+`}
            {!!g.profile.saveModifier && ` · ${s('saveModifier')}: ${signed(g.profile.saveModifier)}`}
            {g.profile.guaranteedSaveSix && ` · ${s('sixSave')}`}</p></details>
        </li>)}</ol>
      </ReviewCard>
      <ReviewCard wide title={s('wizardAttack')} action={s('wizardChangeAttack')} onEdit={() => setWizardStep(3)}>
        <p><strong>{s(params.attackType === 'melee' ? 'melee' : 'ranged')}</strong>{params.attackType !== 'melee' && ` · ${params.cover ? s('cover') : s('wizardCoverOff')}`}</p>
        {sharedContexts.length > 0 && <div className="wizard-review-context"><p className="wizard-eyebrow">{s('situation')}</p>
          <ul>{sharedContexts.map(line => <li key={line}>{line}</li>)}</ul></div>}
        <p className="wizard-eyebrow">{s('wizardWeaponOrder')}</p>
        {squad && <p className="scenario-caption">{s('identicalAttacksHelp')}</p>}
        {attackerGroups.some(g => g.weapons.length > 1) && <p className="scenario-caption">{s('wizardSharedCarriers')}</p>}
        <ol className="wizard-review-list wizard-review-weapons">{attackerGroups.flatMap((g, i) => g.weapons.map((p, j) => {
          const modeProfile = catalog?.weaponModes.find(m => m.id === p.catalogSelection?.modeId);
          const weapon = catalog?.weapons.find(w => w.id === modeProfile?.weaponId);
          const conditions = weaponConditions(p);
          return <li key={`${g.id}-${j}`}>
            <div className="wizard-review-weapon-heading"><strong>{weapon?.name ?? `${s('wizardWeapon')} ${i + 1}.${j + 1}`}{modeProfile && modeProfile.name !== weapon?.name && ` · ${modeProfile.name}`}</strong>
              <span>{s('equipmentCarriers')}: <b>{g.count}</b></span></div>
            <p className="scenario-caption">{s('attackerGroup')} {i + 1} · {profileName(catalog, p, 'attacker', s('wizardManualAttacker'))}</p>
            <p className="wizard-review-profile">{mode === 'required' && !squad ? `${s('inverseUnit')}: ${s('individualAttackUnit')}` : `A ${p.attacksExpression ?? (p.attacksD6 ? 'D6' : p.attacks)}`} · {p.torrent ? 'Torrent' : `${s('skill')} ${p.hitThreshold}+`} · F {p.strength} · FP {p.ap ? -p.ap : 0} · D {p.damageExpression ?? (p.damageD6 ? 'D6' : p.damage)}</p>
            {!params.squadEquipment && weaponContexts(p).map(line => <p key={line}>{line}</p>)}
            {conditions.length > 0 ? <details className="wizard-review-conditions"><summary>{s('wizardReviewConditions')} · {conditions.length}</summary>
              <ul>{conditions.map((line, k) => <li key={k}>{line}</li>)}</ul></details> : <p className="scenario-caption">{s('wizardNoAdjustments')}</p>}
          </li>;
        }))}</ol>
      </ReviewCard>
      {mode === 'required' && <ReviewCard wide title={s('wizardObjective')} action={s('wizardChangeObjective')} onEdit={() => setWizardStep(3, 'wizard-attack-objective')}>
        <dl className="wizard-review-facts"><div><dt>{s('reliability')}</dt><dd>{successPercent.toLocaleString('es-ES')}%</dd></div>
          <div><dt>{s('casualtyGoal')}</dt><dd>{squad ? params.casualtyGoal ?? params.targetModelCount ?? 1 : 1}</dd></div>
          <div><dt>{s('inverseUnit')}</dt><dd>{s(searchUnit === 'models' ? 'modelUnit' : searchUnit === 'activations' ? 'activationUnit' : 'individualAttackUnit')}</dd></div></dl>
      </ReviewCard>}
    </div>
    {partial && <section className="scope-notice wizard-review-omissions" aria-label={s('wizardOmissions')}>
      <h3>{s('wizardOmissionsTitle')}</h3><details><summary>{s('wizardOmissions')} · {limitations.length}</summary><ul>{limitations.map(message => <li key={message}>{message}</li>)}</ul></details>
      {squad ? <label className="touch-choice"><input id="wizard-review-omissions" type="checkbox" checked={accepted}
        onChange={event => setParams({ ...input, acceptedSquadOmissions: event.target.checked ? [...limitations] : [] })} />{s('acceptSquadPartial')}</label>
        : <p>{s('wizardIndividualOmissions')}</p>}
    </section>}
  </WizardScreen>;
}
