import { CombatScenarioForm } from '../combat/CombatScenarioForm';
import { useCatalogInput } from '../../catalog/CatalogContext';
import { CombatScenarioBoundary, useCombatScenario } from '../combat/CombatScenarioContext';
import { ScenarioResultNotice } from '../combat/ScenarioResultNotice';
import { s } from '../../i18n/scenario';
import { RequiredAttackObjective } from './RequiredAttackObjective';
import { SectionCard } from '../../components/SectionCard';
import { ResultBox } from '../../components/ResultBox';
import { useRequiredAttacks, type RequiredAttacksParams } from './useRequiredAttacks';
import { scenarioPanel } from '../combat/scenarioStyles';
import { isSquadScenario } from '@application/dice/squadScenario';
import { useMemo } from 'react';
import { useReportExecution } from '../combat/ReportExecution';

function pct(probability: number) {
  if (probability < 1 && probability * 100 > 99.9999) return '> 99,9999%';
  return `${(probability * 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`;
}
export function RequiredAttacksCalculator() {
  return <CombatScenarioBoundary><RequiredAttacksView /></CombatScenarioBoundary>;
}
function RequiredAttacksView() {
  const { params: scenario, setParams, successPercent, ready, confirmed } = useCombatScenario();
  const report = useReportExecution();
  const params = useMemo<RequiredAttacksParams>(() => ({ ...scenario, damageType: scenario.damageD6 ? 'D6' : 'fixed', successPercent }), [scenario, successPercent]);
  const { result, squadResult, error, isCalculating } = useRequiredAttacks(params);
  const effectiveParams = useCatalogInput(scenario);
  const squadMode = isSquadScenario(effectiveParams);
  const attackLabel = (count: number) => `${s('withAttacks')} ${count} ${s(count === 1 ? 'attackSingular' : 'attacksWord')}`;
  return <SectionCard compact report={confirmed} title={s('requiredTitle')} formula={s(squadMode ? 'inverseSquadHelp' : 'inverseScope')} explanation={s(squadMode ? 'squadHelp' : 'scope')} scopeLabel={s(squadMode ? 'squadScope' : 'scopeShort')}>
    {!confirmed && <><CombatScenarioForm params={scenario} individualAttacks={!squadMode} onChange={setParams} />
      <RequiredAttackObjective params={scenario} squadMode={squadMode} /></>}
    <ScenarioResultNotice ready={ready} error={error ?? undefined} />
    {ready && isCalculating && <p role="status">{s(confirmed ? 'reportGenerating' : 'squadCalculating')}</p>}
    {ready && !error && squadResult && <div role="status" aria-live="polite" className="combat-result" style={scenarioPanel}>
      {!confirmed && effectiveParams.partialCalculation && <p className="scope-notice">{s('partialResult')}</p>}
      {squadResult.status === 'impossible' ? <p>{s('impossible')} {s('belowHundred')}</p> : <>
        {squadResult.status === 'limit' && <p>{s(squadResult.reason === 'complexity' ? 'limitComplexity' : 'limitSearch')}</p>}
        <ResultBox label={s(squadResult.status === 'limit' ? 'reportCheckedAmount' : 'inverseUnitsNeeded')} value={`${squadResult.count} · ${s(squadResult.unit === 'attacks' ? 'individualAttackUnit' : squadResult.unit === 'models' ? 'modelUnit' : 'activationUnit')}`} highlight />
        <ResultBox label={s('casualtyChance')} value={pct(squadResult.probability)} />
        {squadResult.status === 'success' && <ResultBox label={s('previousCount')} value={pct(squadResult.previousProbability)} />}
      </>}
      {squadResult.status !== 'success' && report && <button type="button" className="wizard-text-button" onClick={report.editObjective}>{s('wizardChangeObjective')}</button>}
    </div>}
    {ready && !error && result && <div role="status" aria-live="polite" className="combat-result" style={scenarioPanel}>
      {!confirmed && effectiveParams.partialCalculation && <p className="scope-notice">{s('partialResult')}</p>}
      {result.status === 'success' ? <>
        <p>{s('needs')} <strong>{result.attacks} {s(result.attacks === 1 ? 'attackSingular' : 'attacksWord')}</strong> {s('atLeast')} <strong>{successPercent.toLocaleString('es-ES')}%</strong> {s('reliabilityResult')}</p>
        <ResultBox label={attackLabel(result.attacks)} value={pct(result.probability)} highlight />
        <details><summary>{s('statistics')}</summary><ResultBox label={attackLabel(result.attacks - 1)} value={pct(result.previousProbability)} />
          <p className="scenario-caption">{s('requiredHelp')}</p></details>
      </> : result.status === 'limit' ? <>
        <p>{s(result.reason === 'complexity' ? 'limitComplexity' : 'limitSearch')}</p>
        <p>{attackLabel(result.attacks)}: {pct(result.probability)}</p>
      </> : <p>{result.reason === 'noFiniteGuarantee' ? `${s('impossible')} ${s('belowHundred')}` : s('zeroDamage')}</p>}
      {result.status !== 'success' && report && <button type="button" className="wizard-text-button" onClick={report.editObjective}>{s('wizardChangeObjective')}</button>}
    </div>}
  </SectionCard>;
}
