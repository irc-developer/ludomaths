import { useEffect, useId, useState } from 'react';
import { isSquadScenario } from '@application/dice/squadScenario';
import { useCatalog } from '../../catalog/CatalogContext';
import { CombatScenarioForm } from './CombatScenarioForm';
import { useCombatScenario } from './CombatScenarioContext';
import { NumberDraftScope, useNumberDrafts } from '../../components/NumberDrafts';
import { RequiredAttackObjective } from '../required-attacks/RequiredAttackObjective';
import { WeaponContext } from './SquadScenarioControls';
import { WizardScreen, type WizardError } from './WizardScreen';
import { defenderErrors, validateAttack } from './wizardValidation';
import { s } from '../../i18n/scenario';
import { attackContextId } from './attackContext';

export type CombatMode = 'combat' | 'required' | 'buffs';
export function AttackSetupScreen({ mode }: { mode: CombatMode }) {
  const { params: input, setParams, setWizardStep, successPercent, wizardFocus, reviewReturn } = useCombatScenario();
  const { catalog } = useCatalog();
  const drafts = useNumberDrafts();
  const [submitted, setSubmitted] = useState(0), id = useId();
  const { params, issues: attackIssues, objectiveInvalid } = validateAttack(catalog, input, mode, successPercent);
  const errors: WizardError[] = [...attackIssues.map(issue => ({ ...issue, target: issue.target ?? `${id}-attack` })),
    ...defenderErrors(params).map(message => ({ step: 2, message }))];
  useEffect(() => { if (wizardFocus) document.getElementById(wizardFocus)?.focus(); }, [wizardFocus]);
  errors.push(...Object.entries(drafts.fields).filter(([key, field]) => key.startsWith('attack/') && field.invalid)
    .map(([, field]) => ({ target: field.id, message: `${field.label}: ${s('invalidInput')}` })));
  if (objectiveInvalid) {
    errors.push({ target: 'wizard-attack-objective', message: s('invalidInput') });
  }
  return <NumberDraftScope name="attack" root><WizardScreen step={3} title={s('wizardAttackTitle')} help={s('wizardAttackHelp')}
    errors={errors} submitted={submitted} action={s(reviewReturn ? 'wizardSaveReview' : 'wizardReviewAction')} onBack={() => setWizardStep(2)}
    onContinue={() => { setSubmitted(n => n + 1); if (!errors.length) { setParams(params); setWizardStep(4); } }}>
    <div id={`${id}-attack`} tabIndex={-1}>
      <CombatScenarioForm attackOnly params={input} onChange={setParams} individualAttacks={mode === 'required' && !isSquadScenario(params)} />
      {input.squadEquipment && <p className="scenario-caption">{s('wizardSharedContext')}</p>}
      {!input.squadEquipment && <div className="wizard-weapon-contexts">
        {(params.primaryExtraWeapons ?? []).map((w, i) => <fieldset key={`primary-${i}`}><legend>{s('primaryGroup')} · {s('weapon')} {i + 2}</legend>
          <WeaponContext profile={w} contextId={attackContextId('primary', i + 1)} onChange={next => setParams({ ...params, primaryExtraWeapons: params.primaryExtraWeapons?.map((old, index) => index === i ? next : old) })} />
        </fieldset>)}
        {params.attackerEquipmentGroups?.flatMap((g, i) => g.weapons.map((w, j) => <fieldset key={`${g.id}-${j}`}><legend>{s('attackerGroup')} {i + 2} · {s('weapon')} {j + 1}</legend>
          <WeaponContext profile={w} contextId={attackContextId(g.id, j)} onChange={next => setParams({ ...params, attackerEquipmentGroups: params.attackerEquipmentGroups?.map(old => old.id === g.id ?
            { ...old, weapons: old.weapons.map((p, index) => index === j ? next : p) } : old) })} />
        </fieldset>))}
      </div>}
    </div>
    <div id="wizard-attack-objective" tabIndex={-1}>
      <h3>{s('wizardObjective')}</h3>
      {mode === 'required' ? <NumberDraftScope name="objective"><RequiredAttackObjective params={params} squadMode={isSquadScenario(params)} /></NumberDraftScope>
        : <p className="scenario-caption">{s(mode === 'buffs' ? 'wizardBuffScope' : 'wizardOneActivation')}</p>}
    </div>
    {params.partialCalculation && <p className="scope-notice">{s('profilePartialNotice')}</p>}
  </WizardScreen></NumberDraftScope>;
}
