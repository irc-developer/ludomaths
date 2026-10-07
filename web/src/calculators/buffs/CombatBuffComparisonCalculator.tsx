import { SectionCard } from '../../components/SectionCard';
import { useCatalogInput } from '../../catalog/CatalogContext';
import { CombatScenarioForm } from '../combat/CombatScenarioForm';
import { CombatScenarioBoundary, useCombatScenario } from '../combat/CombatScenarioContext';
import { ScenarioResultNotice } from '../combat/ScenarioResultNotice';
import { useCombatBuffComparison } from './useCombatBuffComparison';
import { s, type ScenarioKey } from '../../i18n/scenario';
import { sp } from '../../styles/tokens';
import type { CombatBuffScenario } from '@application/dice/CompareCombatBuffUseCase';
import { isSquadScenario } from '@application/dice/squadScenario';
import type { SquadCombatResult } from '@application/dice/CalculateSquadCombatUseCase';
const fmt = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '∞';
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

export function CombatBuffComparisonCalculator() {
  return <CombatScenarioBoundary><CombatBuffComparisonView /></CombatScenarioBoundary>;
}
function CombatBuffComparisonView() {
  const { params, setParams, ready } = useCombatScenario();
  const vm = useCombatBuffComparison(params);
  const effectiveParams = useCatalogInput(params);
  const squadMode = isSquadScenario(effectiveParams);
  const rows: [ScenarioKey, CombatBuffScenario][] = [['baseline', vm.baseline], ['skillBuff', vm.plusBallisticSkill],
    ...(vm.plusHitRoll ? [['hitRollBuff', vm.plusHitRoll] as [ScenarioKey, CombatBuffScenario]] : []), ['apBuff', vm.plusArmorPenetration], ['damageBuff', vm.plusDamage]];
  const defense: [ScenarioKey, CombatBuffScenario][] = [['baseline', vm.baseline], ['saveBuff', vm.plusSave]];
  const recommendation: ScenarioKey = vm.recommendedOption === 'hitRoll' ? 'hitRollBuff' : vm.recommendedOption === 'ballisticSkill' ? 'skillBuff' :
    vm.recommendedOption === 'armorPenetration' ? 'apBuff' : vm.recommendedOption === 'damage' ? 'damageBuff' : 'equal';
  function cards(entries: [ScenarioKey, CombatBuffScenario][]) {
    return <div className="improvement-cards">{entries.map(([label, scenario]) => {
      const difference = (scenario.expectedWoundsLost ?? 0) - (vm.baseline.expectedWoundsLost ?? 0);
      return <article key={label} className="improvement-card"><h4>{s(label)}</h4><dl>
        <div><dt>{s('lost')}</dt><dd>{fmt(scenario.expectedWoundsLost ?? 0)}</dd></div>
        <div><dt>{s('kill')}</dt><dd>{pct(scenario.firstRoundKillProbability)}</dd></div>
      </dl>{label !== 'baseline' && <p><small>{s('difference')}: {difference > 0 ? '+' : ''}{fmt(difference)}</small></p>}</article>;
    })}</div>;
  }
  function table(entries: [ScenarioKey, CombatBuffScenario][]) {
    return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderSpacing: sp.sm }}><thead><tr>
      <th scope="col">{s('comparisonOption')}</th><th scope="col">{s('potential')}</th><th scope="col">{s('lost')}</th>
      <th scope="col">{s('kill')}</th><th scope="col">{s('rounds')}</th><th scope="col">{s('residual')}</th>
    </tr></thead><tbody>{entries.map(([label, scenario]) => <tr key={label}><th scope="row" style={{ textAlign: 'left' }}>{s(label)}</th>
      <td>{fmt(scenario.expectedDamage)}</td><td>{fmt(scenario.expectedWoundsLost ?? 0)}</td><td>{pct(scenario.firstRoundKillProbability)}</td>
      <td>{fmt(scenario.expectedRoundsToKill)}</td><td>{pct(scenario.survivingProbability ?? 0)} · {scenario.computedRounds} {s('roundsWord')}
        {scenario.horizonLimited && <small>{s('limitedHorizon')}</small>}</td></tr>)}</tbody></table></div>;
  }
  function squadCards(entries: [ScenarioKey, SquadCombatResult][]) {
    return <div className="improvement-cards">{entries.map(([label, result]) => <article key={label} className="improvement-card"><h4>{s(label)}</h4><dl>
      <div><dt>{s('averageCasualties')}</dt><dd>{fmt(result.expectedCasualties)}</dd></div>
      <div><dt>{s('squadKill')}</dt><dd>{pct(result.pEliminate)}</dd></div>
      <div><dt>{s('lost')}</dt><dd>{fmt(result.expectedWoundsLost)}</dd></div>
    </dl>{label !== 'baseline' && <p><small>{s('difference')}: {fmt(result.expectedCasualties - vm.squadComparison!.baseline.expectedCasualties)} {s('averageCasualties').toLowerCase()}</small></p>}</article>)}</div>;
  }
  return <SectionCard compact title={s('buffsTitle')} formula={s(squadMode ? 'squadFormula' : 'formula')} explanation={s(squadMode ? 'squadHelp' : 'scope')} scopeLabel={s(squadMode ? 'squadScope' : 'scopeShort')}>
    <CombatScenarioForm params={params} onChange={setParams} />
    <ScenarioResultNotice ready={ready} error={vm.error} />
    {ready && vm.isCalculating && <p role="status">{s('squadCalculating')}</p>}
    {ready && !vm.error && !vm.isCalculating && <div className="combat-result">
      {effectiveParams.partialCalculation && <p className="scope-notice">{s('partialResult')}</p>}
      {vm.squadComparison ? <>
        <p>{s('improvementScope')}</p>
        <h3>{s('offense')}</h3><p role="status">{s('recommendation')}: <strong>{s(recommendation)}</strong></p>
        {squadCards([['baseline', vm.squadComparison.baseline], ['skillBuff', vm.squadComparison.plusBallisticSkill],
          ['hitRollBuff', vm.squadComparison.plusHitRoll], ['apBuff', vm.squadComparison.plusArmorPenetration], ['damageBuff', vm.squadComparison.plusDamage]])}
        <h3>{s('defense')}</h3>{squadCards([['baseline', vm.squadComparison.baseline], ['saveBuff', vm.squadComparison.plusSave]])}
      </> : <>
      <h3>{s('offense')}</h3><p role="status">{s('recommendation')}: <strong>{s(recommendation)}</strong></p>{cards(rows)}
      <h3 style={{ marginTop: sp.lg }}>{s('defense')}</h3>{cards(defense)}
      <details className="comparison-details"><summary>{s('detailedComparison')}</summary>
        <p>{s('rankingCriterion')}</p><p>{s('repeatHelp')}</p><h3>{s('offense')}</h3>{table(rows)}<h3>{s('defense')}</h3>{table(defense)}
      </details>
      </>}
    </div>}
  </SectionCard>;
}
