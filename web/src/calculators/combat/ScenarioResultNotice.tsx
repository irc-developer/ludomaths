import { s } from '../../i18n/scenario';
import { useCombatScenario } from './CombatScenarioContext';
export function ScenarioResultNotice({ ready, error }: { ready: boolean; error?: string }) {
  const { draftInvalid } = useCombatScenario();
  if (draftInvalid) return <p role="status" className="combat-result">{s('finishEditing')}</p>;
  if (!ready) return <p role="status" className="combat-result">{s('chooseProfiles')}</p>;
  if (error === s('contextRequired')) return <p role="status" className="combat-result">{error}</p>;
  if (error === s('pending')) return <p role="status" className="combat-result">{s('profilesUnavailable')}</p>;
  // Invalid modes are explained by the catalog panel next to the selection.
  if (!error || error === s('selectionInvalid')) return null;
  return <p role="alert" className="scenario-error combat-result">{error}</p>;
}
