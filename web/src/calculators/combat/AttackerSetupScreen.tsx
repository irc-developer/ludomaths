import { useEffect, useId, useRef, useState } from 'react';
import { CatalogPanel } from '../../catalog/CatalogPanel';
import { useCatalog } from '../../catalog/CatalogContext';
import { useCombatScenario } from './CombatScenarioContext';
import { s } from '../../i18n/scenario';
import { useNumberDrafts } from '../../components/NumberDrafts';
import { validateReview } from './wizardValidation';

export function AttackerSetupScreen({ mode = 'combat' }: { mode?: string }) {
  const { params, setParams, entryMode, setEntryMode, setWizardStep,
    attackerCountDraft, setAttackerCountDraft, manualAttackerName, setManualAttackerName, reviewReturn, successPercent } = useCombatScenario();
  const { catalog, loading } = useCatalog();
  const drafts = useNumberDrafts();
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  useEffect(() => { headingRef.current?.focus(); }, []);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(min-width: 701px)');
    const update = () => setSummaryOpen(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const manual = entryMode === 'manual';
  const selection = params.catalogSelection;
  const unit = catalog?.units.find(u => u.id === selection?.attackerUnitId);
  const composition = catalog?.compositions.find(c => c.id === selection?.attackerCompositionId && c.unitId === unit?.id && !c.conditionRuleIds.length);
  const miniature = catalog?.miniatures.find(m => m.id === selection?.attackerMiniatureId && m.unitId === unit?.id);
  const currentCatalog = !!catalog && selection?.catalogId === catalog.catalogId && selection.catalogVersion === catalog.catalogVersion && selection.payloadSha256 === catalog.payloadSha256;
  const initialCount = composition?.members.reduce((total, m) => total + m.min, 0);
  const max = initialCount ?? 100;
  const text = attackerCountDraft ?? String(params.modelCount ?? 1);
  const count = Number(text);
  const validCount = text.trim() !== '' && Number.isInteger(count) && count >= 1 && count <= max;
  const validSelection = manual || currentCatalog && !!unit && !!miniature;
  const errors: Array<{ target: string; message: string }> = [];
  if (!validSelection) errors.push({ target: `${id}-selection`, message: s(unit ? 'wizardMissingProfile' : 'wizardMissingAttacker') });
  if ((manual || unit) && !validCount) errors.push({ target: `${id}-count`, message: `${s('wizardCountError')} (1–${max}).` });
  function changeCount(next: string) {
    setAttackerCountDraft(next);
    const value = Number(next);
    if (next.trim() && Number.isInteger(value) && value >= 1 && value <= max) setParams({ ...params, modelCount: value });
  }
  function changeEntry(next: 'catalog' | 'manual') {
    if (next === entryMode) return;
    setEntryMode(next); setSubmitted(false); setAttackerCountDraft(undefined);
    drafts.clear();
    if (next === 'catalog') {
      setParams({ ...params, catalogSelection: undefined, squadEquipment: undefined, primaryExtraWeapons: [], attackerEquipmentGroups: [], defenderGroups: [],
        partialCalculation: false, calculationBlocked: true, calculationLimitations: [], acceptedSquadOmissions: [] });
    } else {
      const manualProfile = (profile: typeof params) => ({ ...profile, catalogSelection: undefined, calculationBlocked: false });
      setParams({ ...params, catalogSelection: undefined, squadEquipment: undefined, partialCalculation: false, calculationBlocked: false,
        calculationLimitations: [], acceptedSquadOmissions: [], primaryExtraWeapons: params.primaryExtraWeapons?.map(manualProfile),
        attackerEquipmentGroups: params.attackerEquipmentGroups?.map(g => ({ ...g, weapons: g.weapons.map(manualProfile) })),
        defenderGroups: params.defenderGroups?.map(g => ({ ...g, profile: manualProfile(g.profile) })) });
    }
  }
  function continueSetup() {
    setSubmitted(true);
    if (errors.length) { requestAnimationFrame(() => errorRef.current?.focus()); return; }
    setAttackerCountDraft(undefined);
    const review = reviewReturn ? validateReview(catalog, params, entryMode, mode, successPercent) : undefined;
    const pendingDefense = Object.keys(drafts.pending).some(key => key.startsWith('defender/') && drafts.drafts[key] !== undefined);
    const pendingAttack = Object.keys(drafts.pending).some(key => key.startsWith('attack/') && drafts.drafts[key] !== undefined && (mode === 'required' || !key.startsWith('attack/objective/')));
    setWizardStep(!reviewReturn || pendingDefense || review?.issues.some(issue => issue.step === 2) ? 2 :
      pendingAttack || review?.issues.length ? 3 : 4);
  }
  return <section className="attacker-wizard" aria-labelledby={`${id}-heading`}>
    <header className="wizard-heading">
      <p className="wizard-eyebrow">{s('wizardStepOne')}</p>
      <ol className="wizard-progress" aria-label={s('wizardProgress')}>
        <li aria-current="step"><span>1</span>{s('attacker')}</li>
        <li><span>2</span>{s('defender')}</li><li><span>3</span>{s('wizardAttack')}</li><li><span>4</span>{s('wizardReview')}</li>
      </ol>
      <h2 id={`${id}-heading`} ref={headingRef} tabIndex={-1}>{s('wizardAttackerTitle')}</h2>
      <p className="wizard-intro">{s('wizardAttackerHelp')}</p>
    </header>
    {submitted && errors.length > 0 && <div className="wizard-error-summary" role="alert" ref={errorRef} tabIndex={-1}>
      <strong>{s('wizardCheckSelection')}</strong><ul>{errors.map(error => <li key={error.target}><a href={`#${error.target}`}>{error.message}</a></li>)}</ul>
    </div>}
    <div className="wizard-layout">
      <div className="wizard-main">
        <div className="entry-options" aria-label={s('wizardProfileSource')}>
          <button type="button" aria-pressed={!manual} onClick={() => changeEntry('catalog')}>{s('catalogEntry')}</button>
          <button type="button" aria-pressed={manual} onClick={() => changeEntry('manual')}>{s('manual')}</button>
        </div>
        <div id={`${id}-selection`} tabIndex={-1}>
          {manual ? <label>{s('wizardOptionalName')}<input value={manualAttackerName} maxLength={100} onChange={event => setManualAttackerName(event.target.value)} /></label>
            : <CatalogPanel attackerStep params={params} onChange={next => { setParams(next); setAttackerCountDraft(undefined); drafts.clear('attack/'); }} />}
          {submitted && !validSelection && <p className="scenario-error">{s(unit ? 'wizardMissingProfile' : 'wizardMissingAttacker')}</p>}
        </div>
        {(manual || unit) && <div className="wizard-participants">
          <label htmlFor={`${id}-count`}>{s('attackingModels')}</label>
          <div className="squad-counter-controls">
            <button type="button" aria-label={`${s('attackingModels')} −1`} disabled={!validCount || count <= 1} onClick={() => changeCount(String(count - 1))}>−</button>
            <input id={`${id}-count`} type="number" inputMode="numeric" min={1} max={max} step={1} value={text}
              aria-invalid={submitted && !validCount} aria-describedby={`${id}-count-help${submitted && !validCount ? ` ${id}-count-error` : ''}`}
              onChange={event => changeCount(event.target.value)} />
            <button type="button" aria-label={`${s('attackingModels')} +1`} disabled={!validCount || count >= max} onClick={() => changeCount(String(count + 1))}>+</button>
          </div>
          <p id={`${id}-count-help`} className="scenario-caption">{s(initialCount ? 'wizardParticipantsHelp' : 'wizardManualParticipantsHelp')}</p>
          {submitted && !validCount && <p id={`${id}-count-error`} className="scenario-error">{s('wizardCountError')} (1–{max}).</p>}
        </div>}
      </div>
      <aside className="wizard-selection-summary" aria-label={s('wizardYourSelection')}>
        <details open={summaryOpen}>
        <summary onClick={event => { event.preventDefault(); setSummaryOpen(open => !open); }}>
          {s('wizardYourSelection')}{(manual || unit) && <span>{s('wizardParticipating')}: {validCount ? count : '—'}</span>}
          <span className="wizard-summary-arrow" aria-hidden="true">⌄</span>
        </summary>
        <div className="wizard-summary-content">
        <p className="wizard-eyebrow">{s('wizardYourSelection')}</p>
        {manual || unit ? <>
          <h3>{manual ? manualAttackerName.trim() || s('wizardManualAttacker') : unit!.name}</h3>
          {composition && <><dl><div><dt>{s('equipmentInitialSize')}</dt><dd>{initialCount}</dd></div>
            <div><dt>{s('wizardParticipating')}</dt><dd>{validCount ? count : '—'}</dd></div></dl>
            <ul className="wizard-members">{composition.members.map(m => <li key={m.miniatureId}><span>{catalog?.miniatures.find(v => v.id === m.miniatureId)?.name}</span><strong>{m.min}</strong></li>)}</ul>
          </>}
          {!composition && <p>{!manual && miniature && <>{miniature.name}<br /></>}{s('wizardParticipating')}: <strong>{validCount ? count : '—'}</strong></p>}
        </> : <p className="scenario-caption">{s('wizardEmptySelection')}</p>}
        <div className="wizard-next"><span>02</span><div><strong>{s('wizardNextDefender')}</strong><p>{s('wizardNextDefenderHelp')}</p></div></div>
        </div></details>
      </aside>
    </div>
    <footer className="wizard-footer"><p>{s('wizardWeaponsLater')}</p>
      <button type="button" className="wizard-primary-button" disabled={!manual && loading} onClick={continueSetup}>{s(reviewReturn ? 'wizardSaveReview' : 'wizardContinue')} <span aria-hidden="true">→</span></button>
    </footer>
  </section>;
}
