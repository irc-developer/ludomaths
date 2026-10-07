import { useCatalogInput } from '../../catalog/CatalogContext';
import { CombatScenarioForm } from './CombatScenarioForm';
import { CombatScenarioBoundary, useCombatScenario } from './CombatScenarioContext';
import { ScenarioResultNotice } from './ScenarioResultNotice';
import { s } from '../../i18n/scenario';
import { useRef, useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { ResultBox } from '../../components/ResultBox';
import { DistributionBar } from '../../components/DistributionBar';
import { useCombat } from './useCombat';
import { formatCombatShareText } from './share';
import { buildCombatShareSvg, copyCombatShareImage } from './shareImage';
import { scenarioInput } from './scenarioStyles';
import { isSquadScenario } from '@application/dice/squadScenario';
import { SquadCounter } from './SquadScenarioControls';

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const fmt = (value: number) => value.toFixed(2);

export function CombatCalculator() {
  return <CombatScenarioBoundary><CombatCalculatorView /></CombatScenarioBoundary>;
}
function CombatCalculatorView() {
  const { params, setParams, ready } = useCombatScenario();
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'text' | 'image' | 'fallback' | 'manual'>('idle');
  const shareTextareaRef = useRef<HTMLTextAreaElement>(null);
  const vm = useCombat(params);
  const effectiveParams = useCatalogInput(params);
  const squadMode = isSquadScenario(effectiveParams);
  const valid = ready && !vm.error && !vm.isCalculating;
  const sharePayload = { params: effectiveParams, vm };
  const shareText = valid && shareOpen ? formatCombatShareText(sharePayload) : '';
  const shareImageUrl = valid && shareOpen ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildCombatShareSvg(sharePayload))}` : '';
  async function copyText(next: 'text' | 'fallback' = 'text') {
    if (!shareText) return;
    try { await navigator.clipboard.writeText(shareText); setCopyStatus(next); }
    catch { setCopyStatus('manual'); requestAnimationFrame(() => { shareTextareaRef.current?.focus(); shareTextareaRef.current?.select(); }); }
  }
  async function copyImage() {
    if (!shareText) return;
    const result = await copyCombatShareImage(sharePayload);
    if (result === 'copied') setCopyStatus('image'); else await copyText('fallback');
  }
  return <SectionCard compact title={s('title')} formula={s(squadMode ? 'squadFormula' : 'formula')} explanation={s(squadMode ? 'squadHelp' : 'scope')} scopeLabel={s(squadMode ? 'squadScope' : 'scopeShort')}>
    <CombatScenarioForm params={params} onChange={next => { setParams(next); setCopyStatus('idle'); }} />
    <ScenarioResultNotice ready={ready} error={vm.error} />
    {ready && vm.isCalculating && <p role="status">{s('squadCalculating')}</p>}
    {valid && <div className="combat-result">
      {effectiveParams.partialCalculation && <p className="scope-notice">{s('partialResult')}</p>}
      {vm.squad ? <>
        <p>{params.modelCount ?? 1} {s('attackersWord')} {vm.squad.modelCount} {s('defendersWord')}</p>
        <div className="result-metrics" role="status" aria-live="polite">
          <ResultBox label={s('averageCasualties')} value={fmt(vm.squad.expectedCasualties)} highlight />
          <ResultBox label={s('squadKill')} value={pct(vm.squad.pEliminate)} highlight />
          <ResultBox label={s('averageSurvivors')} value={fmt(vm.squad.expectedSurvivors)} />
          <ResultBox label={s('lost')} value={fmt(vm.squad.expectedWoundsLost)} />
        </div>
        <SquadCounter label={s('casualtyGoal')} value={params.casualtyGoal ?? vm.squad.modelCount} max={vm.squad.modelCount}
          onChange={value => setParams({ ...params, casualtyGoal: value })} />
        <ResultBox label={s('casualtyChance')} value={pct(vm.squad.casualtiesDist.filter(e => e.value >= (params.casualtyGoal ?? vm.squad!.modelCount)).reduce((sum, e) => sum + e.probability, 0))} />
        <DistributionBar entries={Array.from({ length: vm.squad.modelCount + 1 }, (_, value) => ({ value,
          probability: vm.squad!.casualtiesDist.find(e => e.value === value)?.probability ?? 0 }))}
          minProbability={0} maxEntries={101} title={s('casualtiesDistribution')} />
      </> : <>
      <div className="result-metrics" role="status" aria-live="polite">
        <ResultBox label={s('kill')} value={pct(vm.pEliminate)} highlight />
        <ResultBox label={s('lost')} value={fmt(vm.expectedWoundsLost ?? 0)} />
      </div>
      <section className="result-details" aria-label={s('resultStatistics')}>
        <h3>{s('resultStatistics')}</h3>
        <div className="result-metrics">
          <ResultBox label={s('potential')} value={fmt(vm.expectedDamage)} />
          <ResultBox label={s('mostLikely')} value={String(vm.mostLikelyDamage)} />
          <ResultBox label={s('median')} value={String(vm.medianDamage)} />
          <ResultBox label={s('central')} value={`${vm.centralRange.low}–${vm.centralRange.high}`} />
          <ResultBox label={s('anyDamage')} value={pct(vm.pAtLeastOne)} />
        </div>
        <p className="scenario-caption">{s('potentialHelp')}</p>
        <DistributionBar entries={vm.distribution} title={s('distribution')} />
      </section>
      </>}
      <details className="share-panel" onToggle={event => setShareOpen(event.currentTarget.open)}><summary>{s('share')}</summary>
        {shareOpen && <div>
          <div className="entry-options"><button onClick={() => void copyImage()}>{s('shareCopyImage')}</button>
            <button onClick={() => void copyText()}>{s('shareCopyText')}</button></div>
          <img src={shareImageUrl} alt={s('shareImageAlt')} style={{ display: 'block', width: '100%', height: 'auto' }} />
          {copyStatus === 'manual' && <textarea aria-label={s('shareManual')} ref={shareTextareaRef} readOnly value={shareText} rows={8} style={scenarioInput} />}
          {copyStatus !== 'idle' && <p role="status">{s(copyStatus === 'image' ? 'shareCopiedImage' : copyStatus === 'text' ? 'shareCopiedText' : copyStatus === 'fallback' ? 'shareFallback' : 'shareManual')}</p>}
        </div>}
      </details>
    </div>}
  </SectionCard>;
}
