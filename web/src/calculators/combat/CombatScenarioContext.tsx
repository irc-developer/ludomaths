import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { WH40K_PRESETS, type CombatParams } from './presets';

type EntryMode = 'catalog' | 'manual';
interface ScenarioSession {
  params: CombatParams; setParams: Dispatch<SetStateAction<CombatParams>>;
  entryMode: EntryMode; setEntryMode: Dispatch<SetStateAction<EntryMode>>;
  successPercent: number; setSuccessPercent: Dispatch<SetStateAction<number>>;
  draftInvalid: boolean; setDraftInvalid: (invalid: boolean) => void;
}
const ScenarioContext = createContext<ScenarioSession | null>(null);

export function CombatScenarioProvider({ children, initialEntryMode = 'catalog' }: { children: ReactNode; initialEntryMode?: EntryMode }) {
  const [params, setParams] = useState<CombatParams>(WH40K_PRESETS[0].params);
  const [entryMode, setEntryMode] = useState<EntryMode>(initialEntryMode);
  const [successPercent, setSuccessPercent] = useState(90);
  const [draftInvalid, setDraftInvalid] = useState(false);
  return <ScenarioContext.Provider value={{ params, setParams, entryMode, setEntryMode, successPercent, setSuccessPercent, draftInvalid, setDraftInvalid }}>
    {children}
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
