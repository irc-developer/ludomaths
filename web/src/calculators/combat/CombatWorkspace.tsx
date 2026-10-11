import { useEffect, useMemo, useRef, useState } from 'react';
import { useCombatScenario } from './CombatScenarioContext';
import { useNumberDrafts } from '../../components/NumberDrafts';
import { AttackerSetupScreen } from './AttackerSetupScreen';
import { DefenderSetupScreen } from './DefenderSetupScreen';
import { AttackSetupScreen, type CombatMode } from './AttackSetupScreen';
import { ReviewSetupScreen } from './ReviewSetupScreen';
import { ReportScreen } from './ReportScreen';
import { WH40K_PRESETS } from './presets';
import { s } from '../../i18n/scenario';

/** Calculators mount only after confirmation, under an independent effective scenario. */
export function CombatWorkspace({ mode, onModeChange }: { mode: CombatMode; onModeChange?: (mode: CombatMode) => void }) {
  const session = useCombatScenario();
  const { wizardStep, setWizardStep, confirmedScenario } = session;
  const drafts = useNumberDrafts();
  const cache = useMemo(() => new Map<string, unknown>(), [confirmedScenario]);
  const [attempt, setAttempt] = useState(0);
  const previousMode = useRef(mode);
  const modeChanged = previousMode.current !== mode;
  useEffect(() => {
    if (modeChanged && wizardStep >= 4) setWizardStep(3);
    previousMode.current = mode;
  }, [mode, modeChanged, wizardStep, setWizardStep]);
  function resetEditing() {
    drafts.clear(); session.setDraftInvalid(false); session.setAttackerCountDraft(undefined);
  }
  function cancel() {
    if (!confirmedScenario) return;
    resetEditing();
    session.setParams(structuredClone(confirmedScenario.params));
    session.setEntryMode(confirmedScenario.entryMode ?? (confirmedScenario.params.catalogSelection ? 'catalog' : 'manual'));
    session.setManualAttackerName(confirmedScenario.manualAttackerName ?? confirmedScenario.attackerName); session.setManualDefenderName(confirmedScenario.manualDefenderName ?? confirmedScenario.defenderName);
    session.setWoundedDefenderId(confirmedScenario.woundedDefenderId);
    session.setAttackModes({ ...confirmedScenario.attackModes }); session.setSuccessPercent(confirmedScenario.successPercent);
    previousMode.current = confirmedScenario.mode; onModeChange?.(confirmedScenario.mode);
    setWizardStep(5);
  }
  function startNew() {
    resetEditing(); session.setParams(structuredClone(WH40K_PRESETS[0].params));
    session.setManualAttackerName(''); session.setManualDefenderName(''); session.setWoundedDefenderId(undefined);
    session.setAttackModes({}); session.setSuccessPercent(90); session.setConfirmedScenario(null); session.resetWizard();
  }
  if (wizardStep === 5 && !modeChanged && confirmedScenario) return <ReportScreen scenario={confirmedScenario} cache={cache} attempt={attempt}
    onEdit={setWizardStep} onNew={startNew} onRetry={() => { cache.clear(); setAttempt(n => n + 1); }} />;
  return <>
    {confirmedScenario && <div className="wizard-editing" role="status"><div><strong>{s('reportEditing')}</strong><p>{s('reportEditingHelp')}</p></div>
      <button type="button" className="wizard-text-button" onClick={cancel}>{s('reportCancel')}</button></div>}
    {wizardStep === 1 ? <AttackerSetupScreen mode={mode} /> : wizardStep === 2 ? <DefenderSetupScreen mode={mode} /> :
      wizardStep === 3 || modeChanged ? <AttackSetupScreen mode={mode} /> : <ReviewSetupScreen mode={mode} />}
  </>;
}
