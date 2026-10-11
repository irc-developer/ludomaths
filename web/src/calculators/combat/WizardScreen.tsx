import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useCombatScenario } from './CombatScenarioContext';
import { useCatalog } from '../../catalog/CatalogContext';
import { s } from '../../i18n/scenario';

export interface WizardError { message: string; target?: string; step?: number }
export function WizardScreen({ step, title, help, children, errors, submitted, onBack, onContinue, action = s('wizardContinue'), disabled = false }:
  { step: 2 | 3 | 4; title: string; help: string; children: ReactNode; errors: WizardError[]; submitted: boolean | number;
    onBack: () => void; onContinue: () => void; action?: string; disabled?: boolean }) {
  const id = useId(), heading = useRef<HTMLHeadingElement>(null), errorSummary = useRef<HTMLDivElement>(null);
  const { setWizardStep } = useCombatScenario();
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { if (submitted && errors.length) errorSummary.current?.focus(); }, [submitted, errors.length]);
  const labels = [s('attacker'), s('defender'), s('wizardAttack'), s('wizardReview')];
  return <section className="attacker-wizard" aria-labelledby={`${id}-heading`}>
    <header className="wizard-heading"><p className="wizard-eyebrow">{s(step === 2 ? 'wizardStepTwo' : step === 3 ? 'wizardStepThree' : 'wizardStepFour')}</p>
      <ol className="wizard-progress" aria-label={s('wizardProgress')}>{labels.map((label, index) => <li key={label} aria-current={index + 1 === step ? 'step' : undefined}>
        {index + 1 < step ? <button type="button" onClick={() => setWizardStep(index + 1)}><span>{index + 1}</span>{label}</button> : <><span>{index + 1}</span>{label}</>}
      </li>)}</ol>
      <h2 id={`${id}-heading`} ref={heading} tabIndex={-1}>{title}</h2><p className="wizard-intro">{help}</p>
    </header>
    {!!submitted && errors.length > 0 && <div className="wizard-error-summary" role="alert" tabIndex={-1} ref={errorSummary}>
      <strong>{s('wizardCheckFields')}</strong><ul>{errors.map((error, i) => <li key={i}>{error.step && error.step !== step ? <button className="wizard-text-button" type="button" onClick={() => setWizardStep(error.step!, error.target)}>{error.message} → {labels[error.step - 1]}</button> : error.target ? <a href={`#${error.target}`} onClick={() => {
        const target = document.getElementById(error.target!);
        let parent = target?.parentElement;
        while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
        target?.focus();
      }}>{error.message}</a> : error.message}</li>)}</ul>
    </div>}
    <div className={step === 4 ? 'wizard-review-layout' : 'wizard-layout'}><div className="wizard-main">{children}</div>{step !== 4 && <EncounterSummary step={step} />}</div>
    <footer className="wizard-footer"><button className="wizard-text-button" type="button" onClick={onBack}>← {s('wizardBack')}</button>
      <button className="wizard-primary-button" type="button" disabled={disabled} onClick={onContinue}>{action} <span aria-hidden="true">→</span></button>
    </footer>
  </section>;
}

export function EncounterSummary({ step }: { step: number }) {
  const { params, entryMode, manualAttackerName, manualDefenderName, setWizardStep } = useCombatScenario();
  const { catalog } = useCatalog();
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(min-width: 701px)');
    const update = () => setOpen(media.matches); update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return <aside className="wizard-selection-summary" aria-label={s('wizardEncounter')}><details open={open}>
    <summary onClick={event => { event.preventDefault(); setOpen(value => !value); }}>{s('wizardEncounter')}<span>{params.modelCount ?? 1} → {params.targetModelCount ?? 1}</span><span className="wizard-summary-arrow" aria-hidden="true">⌄</span></summary>
    <div className="wizard-summary-content"><p className="wizard-eyebrow">{s('wizardEncounter')}</p>
      {(['attacker', 'defender'] as const).map((side, i) => {
        const selection = params.catalogSelection;
        const unitId = side === 'attacker' ? selection?.attackerUnitId : selection?.defenderUnitId;
        const unit = catalog?.units.find(u => u.id === unitId);
        const name = side === 'attacker' ? manualAttackerName.trim() || s('wizardManualAttacker') : manualDefenderName.trim() || s('wizardManualDefender');
        return (i === 0 || step >= 3) && <div className="wizard-encounter-side" key={side}><p className="wizard-eyebrow">{s(side)}</p>
          <h3>{entryMode === 'manual' ? name : unit?.name ?? '—'}</h3>
          <p>{s(side === 'attacker' ? 'wizardParticipating' : 'defendingModels')}: <strong>{side === 'attacker' ? params.modelCount ?? 1 : params.targetModelCount ?? 1}</strong></p>
          <button className="wizard-text-button" type="button" onClick={() => setWizardStep(i + 1)}>{s(side === 'attacker' ? 'wizardChangeAttacker' : 'wizardChangeDefender')}</button>
        </div>;
      })}
    </div></details></aside>;
}
