import { useEffect, useRef } from 'react';
import { useCatalog, ResolvedScenarioProvider } from '../../catalog/CatalogContext';
import { s } from '../../i18n/scenario';
import { CombatScenarioProvider, type ConfirmedScenario } from './CombatScenarioContext';
import { CombatCalculator } from './CombatCalculator';
import { RequiredAttacksCalculator } from '../required-attacks/RequiredAttacksCalculator';
import { CombatBuffComparisonCalculator } from '../buffs/CombatBuffComparisonCalculator';
import { ReportExecutionProvider } from './ReportExecution';

export function ReportScreen({ scenario, cache, attempt, onRetry, onEdit, onNew }: {
  scenario: ConfirmedScenario; cache: Map<string, unknown>; attempt: number;
  onRetry: () => void; onEdit: (step: number, focus?: string) => void; onNew: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { catalog } = useCatalog();
  const p = scenario.params, selection = p.catalogSelection;
  const expired = !!selection && (!catalog || catalog.catalogId !== selection.catalogId ||
    catalog.catalogVersion !== selection.catalogVersion || catalog.payloadSha256 !== selection.payloadSha256);
  useEffect(() => { heading.current?.focus(); }, [scenario, attempt]);
  return <article className="wizard-report" aria-labelledby="wizard-report-title">
    <header className="wizard-report-heading"><div><p className="wizard-eyebrow">{s('reportConfirmed')}</p>
      <h2 id="wizard-report-title" tabIndex={-1} ref={heading}>{s(scenario.mode === 'required' ? 'reportRequiredTitle' : scenario.mode === 'buffs' ? 'reportBuffsTitle' : 'reportCombatTitle')}</h2></div>
      <button type="button" className="wizard-text-button" onClick={() => onEdit(4)}>{s('wizardReviewAction')}</button>
    </header>
    <section className="wizard-report-summary" aria-label={s('reportSummary')}>
      <div><p className="wizard-eyebrow">{s('attacker')}</p><h3>{scenario.attackerName}</h3>
        <p>{p.modelCount ?? 1} · {s('wizardParticipating')}</p><button type="button" className="wizard-text-button" onClick={() => onEdit(1)}>← {s('wizardChangeAttacker')}</button></div>
      <div><p className="wizard-eyebrow">{s('defender')}</p><h3>{scenario.defenderName}</h3>
        <p>{p.targetModelCount ?? 1} · {s('defendingModels')}</p>
        {!!p.damageReduction && <p>{s('damageReduction')}: −{p.damageReduction}</p>}
        {p.defenderGroups?.map((g, i) => g.profile.damageReduction ? <p key={g.id}>{s('defenderGroup')} {i + 2} · {s('damageReduction')}: −{g.profile.damageReduction}</p> : null)}
        <button type="button" className="wizard-text-button" onClick={() => onEdit(2)}>← {s('wizardChangeDefender')}</button></div>
      <div><p className="wizard-eyebrow">{s('wizardAttack')}</p><h3>{s(p.attackType === 'melee' ? 'melee' : 'ranged')}</h3>
        <p>{s(scenario.mode === 'required' ? 'reportInverseScope' : 'reportActivationScope')}</p>
        <button type="button" className="wizard-text-button" onClick={() => onEdit(3)}>← {s('wizardChangeAttack')}</button></div>
      {scenario.mode === 'required' && <div className="wizard-report-objective"><p>{s('reportReliability')}: <strong>{scenario.successPercent}%</strong>
        {(p.targetModelCount ?? 1) > 1 && <> · {s('casualtyGoal')}: <strong>{p.casualtyGoal ?? p.targetModelCount}</strong></>}</p>
        <button type="button" className="wizard-text-button" onClick={() => onEdit(3, 'wizard-attack-objective')}>{s('wizardChangeObjective')}</button></div>}
    </section>
    {expired && <div className="wizard-report-notice" role="status"><p>{s('reportCatalogExpired')}</p>
      <button type="button" className="wizard-text-button" onClick={() => onEdit(1)}>{s('wizardChangeAttacker')}</button></div>}
    {p.partialCalculation && <aside className="wizard-report-notice" aria-label={s('wizardOmissions')}>
      <strong>{s('partialResult')}</strong><p>{s('reportPartialHelp')}</p>
      <details><summary>{s('wizardOmissions')}</summary><ul>{(p.calculationLimitations ?? []).map(line => <li key={line}>{line}</li>)}</ul></details>
    </aside>}
    <ReportExecutionProvider cache={cache} retry={onRetry} editObjective={() => onEdit(3, 'wizard-attack-objective')}>
      <ResolvedScenarioProvider><CombatScenarioProvider key={attempt} snapshot={scenario} initialEntryMode="manual">
        {scenario.mode === 'combat' ? <CombatCalculator /> : scenario.mode === 'required' ? <RequiredAttacksCalculator /> : <CombatBuffComparisonCalculator />}
      </CombatScenarioProvider></ResolvedScenarioProvider>
    </ReportExecutionProvider>
    <footer className="wizard-report-footer"><p>{s('reportNewHelp')}</p><button type="button" className="wizard-text-button" onClick={onNew}>{s('reportNew')}</button></footer>
  </article>;
}
