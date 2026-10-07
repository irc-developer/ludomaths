import { CombatScenarioForm } from '../combat/CombatScenarioForm';
import { useCatalogInput } from '../../catalog/CatalogContext';
import { CombatScenarioBoundary, useCombatScenario } from '../combat/CombatScenarioContext';
import { ScenarioResultNotice } from '../combat/ScenarioResultNotice';
import { s } from '../../i18n/scenario';
import { InputField } from '../../components/InputField';
import { SectionCard } from '../../components/SectionCard';
import { ResultBox } from '../../components/ResultBox';
import { useRequiredAttacks, type RequiredAttacksParams } from './useRequiredAttacks';
import { scenarioPanel, scenarioInput } from '../combat/scenarioStyles';
import { isSquadScenario } from '@application/dice/squadScenario';
import { SquadCounter } from '../combat/SquadScenarioControls';

function pct(probability: number) {
  if (probability < 1 && probability * 100 > 99.9999) return '> 99,9999%';
  return `${(probability * 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`;
}
export function RequiredAttacksCalculator() {
  return <CombatScenarioBoundary><RequiredAttacksView /></CombatScenarioBoundary>;
}
function RequiredAttacksView() {
  const { params: scenario, setParams, successPercent, setSuccessPercent, setDraftInvalid, ready } = useCombatScenario();
  const params: RequiredAttacksParams = { ...scenario, damageType: scenario.damageD6 ? 'D6' : 'fixed', successPercent };
  const { result, squadResult, error, isCalculating } = useRequiredAttacks(params);
  const effectiveParams = useCatalogInput(scenario);
  const squadMode = isSquadScenario(effectiveParams);
  const mixedWeapons = !!scenario.attackerEquipmentGroups?.length || !!scenario.primaryExtraWeapons?.length;
  const attackLabel = (count: number) => `${s('withAttacks')} ${count} ${s(count === 1 ? 'attackSingular' : 'attacksWord')}`;
  return <SectionCard compact title={s('requiredTitle')} formula={s(squadMode ? 'inverseSquadHelp' : 'inverseScope')} explanation={s(squadMode ? 'squadHelp' : 'scope')} scopeLabel={s(squadMode ? 'squadScope' : 'scopeShort')}>
    <CombatScenarioForm params={scenario} individualAttacks={!squadMode} onChange={setParams} />
    {squadMode && <div style={scenarioPanel}>
      <SquadCounter label={s('casualtyGoal')} value={scenario.casualtyGoal ?? scenario.targetModelCount ?? 1} max={scenario.targetModelCount ?? 1}
        onChange={value => setParams({ ...scenario, casualtyGoal: value })} />
      <label>{s('inverseUnit')}<select style={scenarioInput} value={mixedWeapons ? 'activations' : scenario.requiredSquadUnit ?? 'attacks'}
        onChange={event => setParams({ ...scenario, requiredSquadUnit: event.target.value as 'attacks' | 'models' | 'activations' })}>
        {!mixedWeapons && <><option value="attacks">{s('individualAttackUnit')}</option><option value="models">{s('modelUnit')}</option></>}
        <option value="activations">{s('activationUnit')}</option></select></label>
    </div>}
    <div style={scenarioPanel}>
      <InputField label={s('reliability')} value={successPercent} min={0.01} max={100} step={0.1} onChange={setSuccessPercent} onDraftValidityChange={setDraftInvalid} />
      <div className="entry-options">{[50, 75, 90, 95, 99].map(value => <button key={value} onClick={() => setSuccessPercent(value)} aria-pressed={successPercent === value}>{value}%</button>)}</div>
    </div>
    <ScenarioResultNotice ready={ready} error={error ?? undefined} />
    {ready && isCalculating && <p role="status">{s('squadCalculating')}</p>}
    {ready && !error && squadResult && <div role="status" aria-live="polite" className="combat-result" style={scenarioPanel}>
      {effectiveParams.partialCalculation && <p className="scope-notice">{s('partialResult')}</p>}
      {squadResult.status === 'impossible' ? <p>{s('impossible')} {s('belowHundred')}</p> : <>
        {squadResult.status === 'limit' && <p>{s(squadResult.reason === 'complexity' ? 'limitComplexity' : 'limitSearch')}</p>}
        <ResultBox label={s('inverseUnitsNeeded')} value={`${squadResult.count} · ${s(squadResult.unit === 'attacks' ? 'individualAttackUnit' : squadResult.unit === 'models' ? 'modelUnit' : 'activationUnit')}`} highlight />
        <ResultBox label={s('casualtyChance')} value={pct(squadResult.probability)} />
        {squadResult.status === 'success' && <ResultBox label={s('previousCount')} value={pct(squadResult.previousProbability)} />}
      </>}
    </div>}
    {ready && !error && result && <div role="status" aria-live="polite" className="combat-result" style={scenarioPanel}>
      {effectiveParams.partialCalculation && <p className="scope-notice">{s('partialResult')}</p>}
      {result.status === 'success' ? <>
        <p>{s('needs')} <strong>{result.attacks} {s(result.attacks === 1 ? 'attackSingular' : 'attacksWord')}</strong> {s('atLeast')} <strong>{successPercent.toLocaleString('es-ES')}%</strong> {s('reliabilityResult')}</p>
        <ResultBox label={attackLabel(result.attacks)} value={pct(result.probability)} highlight />
        <details><summary>{s('statistics')}</summary><ResultBox label={attackLabel(result.attacks - 1)} value={pct(result.previousProbability)} />
          <p className="scenario-caption">{s('requiredHelp')}</p></details>
      </> : result.status === 'limit' ? <>
        <p>{s(result.reason === 'complexity' ? 'limitComplexity' : 'limitSearch')}</p>
        <p>{attackLabel(result.attacks)}: {pct(result.probability)}</p>
      </> : <p>{result.reason === 'noFiniteGuarantee' ? `${s('impossible')} ${s('belowHundred')}` : s('zeroDamage')}</p>}
    </div>}
  </SectionCard>;
}
