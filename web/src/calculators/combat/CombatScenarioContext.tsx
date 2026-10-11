import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { WH40K_PRESETS, type CombatParams } from './presets';
import { NumberDraftProvider } from '../../components/NumberDrafts';

type EntryMode = 'catalog' | 'manual';
export interface ConfirmedScenario {
  params: CombatParams; mode: 'combat' | 'required' | 'buffs'; successPercent: number;
  attackerName: string; defenderName: string;
  entryMode?: EntryMode; woundedDefenderId?: string; attackModes?: Record<string, string>;
  manualAttackerName?: string; manualDefenderName?: string;
}
interface ScenarioSession {
  params: CombatParams; setParams: Dispatch<SetStateAction<CombatParams>>;
  entryMode: EntryMode; setEntryMode: Dispatch<SetStateAction<EntryMode>>;
  successPercent: number; setSuccessPercent: Dispatch<SetStateAction<number>>;
  draftInvalid: boolean; setDraftInvalid: (invalid: boolean) => void;
  attackerCountDraft: string | undefined; setAttackerCountDraft: (draft: string | undefined) => void;
  manualAttackerName: string; setManualAttackerName: (name: string) => void;
  wizardStep: number; setWizardStep: (step: number, focus?: string) => void;
  resetWizard: () => void;
  manualDefenderName: string; setManualDefenderName: (name: string) => void;
  woundedDefenderId: string | undefined; setWoundedDefenderId: (id: string | undefined) => void;
  attackModes: Record<string, string>; setAttackModes: Dispatch<SetStateAction<Record<string, string>>>;
  reviewReturn: boolean;
  wizardFocus: string | undefined;
  confirmed: boolean;
  confirmedScenario: ConfirmedScenario | null; setConfirmedScenario: (scenario: ConfirmedScenario | null) => void;
}
const ScenarioContext = createContext<ScenarioSession | null>(null);

export function CombatScenarioProvider({ children, initialEntryMode = 'catalog', snapshot }: { children: ReactNode; initialEntryMode?: EntryMode; snapshot?: ConfirmedScenario }) {
  const [params, setParams] = useState<CombatParams>(() => snapshot ? structuredClone(snapshot.params) : WH40K_PRESETS[0].params);
  const [entryMode, setEntryMode] = useState<EntryMode>(initialEntryMode);
  const [successPercent, setSuccessPercent] = useState(snapshot?.successPercent ?? 90);
  const [draftInvalid, setDraftInvalid] = useState(false);
  const [attackerCountDraft, setAttackerCountDraft] = useState<string>();
  const [manualAttackerName, setManualAttackerName] = useState(snapshot?.attackerName ?? '');
  const [manualDefenderName, setManualDefenderName] = useState(snapshot?.defenderName ?? '');
  const [wizardStep, updateWizardStep] = useState(1);
  const [reviewReturn, setReviewReturn] = useState(false);
  const [wizardFocus, setWizardFocus] = useState<string>();
  const [confirmedScenario, setConfirmedScenario] = useState<ConfirmedScenario | null>(null);
  function setWizardStep(step: number, focus?: string) {
    if (wizardStep >= 4 && step < 4) setReviewReturn(true);
    if (step >= 4) setReviewReturn(false);
    setWizardFocus(focus); updateWizardStep(step);
  }
  const [woundedDefenderId, setWoundedDefenderId] = useState<string>();
  const [attackModes, setAttackModes] = useState<Record<string, string>>({});
  return <ScenarioContext.Provider value={{ params, setParams, entryMode, setEntryMode, successPercent, setSuccessPercent, draftInvalid, setDraftInvalid,
    attackerCountDraft, setAttackerCountDraft, manualAttackerName, setManualAttackerName,
    wizardStep, setWizardStep, resetWizard: () => { updateWizardStep(1); setReviewReturn(false); setWizardFocus(undefined); }, manualDefenderName, setManualDefenderName, woundedDefenderId, setWoundedDefenderId, attackModes, setAttackModes,
    reviewReturn, wizardFocus, confirmed: !!snapshot, confirmedScenario, setConfirmedScenario }}>
    <NumberDraftProvider>{children}</NumberDraftProvider>
  </ScenarioContext.Provider>;
}

/** Standalone calculators and their child controls also share a single session. */
export function CombatScenarioBoundary({ children }: { children: ReactNode }) {
  const shared = useContext(ScenarioContext);
  return shared ? children : <CombatScenarioProvider initialEntryMode="manual">{children}</CombatScenarioProvider>;
}
export function useCombatScenario() {
  const session = useContext(ScenarioContext);
  if (!session) throw new Error('SCENARIO_PROVIDER_REQUIRED');
  const ready = !session.draftInvalid && (session.entryMode === 'manual' || !!(session.params.catalogSelection?.modeId && session.params.catalogSelection?.defenderMiniatureId));
  return { ...session, ready };
}
