import { useId, useState } from 'react';
import { ResultBox } from '../../components/ResultBox';
import { useCharge } from './useCharge';
import './charge.css';

function pct(value: number, decimals = 2): string {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value * 100) + ' %';
}

/** Keep incomplete drafts and both decimal separators without rounding measurements. */
function parseDraft(text: string): number {
  const trimmed = text.trim();
  return /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(trimmed) ? Number(trimmed.replace(',', '.')) : NaN;
}

export function ChargeCalculator() {
  const id = useId();
  const [distanceText, setDistanceText] = useState('9');
  const [modifierText, setModifierText] = useState('0');
  const [reroll, setReroll] = useState(false);
  const [observedSix, setObservedSix] = useState(false);
  const distance = parseDraft(distanceText);
  const chargeRollModifier = parseDraft(modifierText);
  const distanceInvalid = !Number.isFinite(distance) || distance <= 0;
  const modifierInvalid = !Number.isSafeInteger(chargeRollModifier);
  const vm = useCharge({ distance, reroll: reroll ? 'failures' : 'none', observedSix, chargeRollModifier });
  const showResult = vm.status === 'ready' && vm.currentProbability !== null;
  const activeOptions = [
    modifierInvalid ? 'revisa el modificador' : chargeRollModifier !== 0 ? (chargeRollModifier > 0 ? '+' : '') + chargeRollModifier : '',
    observedSix ? 'un 6 observado' : '',
  ].filter(Boolean);

  return (
    <section className="charge-calculator" aria-labelledby={id + '-title'}>
      <h2 id={id + '-title'}>Carga WH40K</h2>
      <p className="charge-note charge-edition">11.ª edición · 2D6</p>

      <div className="charge-main">
        <div className="charge-field">
          <label htmlFor={id + '-distance'}>Distancia (″)</label>
          <input
            id={id + '-distance'} type="text" inputMode="decimal" value={distanceText}
            onChange={event => setDistanceText(event.target.value)}
            aria-invalid={distanceInvalid || undefined}
            aria-describedby={distanceInvalid ? id + '-error' : undefined}
          />
        </div>
        <label className="charge-toggle">
          <input type="checkbox" checked={reroll} onChange={event => setReroll(event.target.checked)} />
          <span>Repetir carga</span>
        </label>
      </div>

      <details className="charge-options">
        <summary>Opciones{activeOptions.length > 0 ? ' · ' + activeOptions.join(' · ') : ''}</summary>
        <div className="charge-option-fields">
          <div className="charge-field">
            <label htmlFor={id + '-modifier'}>Modificador</label>
            <input
              id={id + '-modifier'} type="text" inputMode="text" value={modifierText}
              onChange={event => setModifierText(event.target.value)}
              aria-invalid={modifierInvalid || undefined}
              aria-describedby={modifierInvalid ? id + '-error' : undefined}
            />
          </div>
          <label className="charge-toggle">
            <input type="checkbox" checked={observedSix} onChange={event => setObservedSix(event.target.checked)} />
            <span>Un dado ya es 6</span>
          </label>
        </div>
        {observedSix && <p className="charge-note">Si repites la carga, vuelves a tirar ambos dados.</p>}
      </details>

      <div aria-live="polite" aria-atomic="true" className="charge-result">
        {vm.error && <p id={id + '-error'} role="alert" className="charge-error">{vm.error}</p>}
        {vm.status === 'outsideRange' && <p role="status">Fuera de alcance: el objetivo debe estar a 12″ o menos.</p>}
        {vm.status === 'checkEngagement' && <p role="status">A 2″ o menos, comprueba si ya estás trabado. Las cargas con alturas no se calculan aquí.</p>}
        {showResult && <div role="region" aria-label="Resultado de distancia de carga">
          <ResultBox label={'Alcanzar ' + distanceText.trim() + '″'} value={pct(vm.currentProbability!)} highlight />
          <p className="charge-note">Supone una carga legal y un recorrido viable.</p>
        </div>}
      </div>

      {showResult && <div role="region" aria-label="Tabla de distancia de carga">
        <h3>Otras distancias</h3>
        <div className="charge-reference">
          {vm.referenceTable.map(({ distance: d, probability }) => (
            <button key={d} type="button" aria-label={'Elegir distancia de ' + d + ' pulgadas'}
              aria-pressed={d === distance} onClick={() => setDistanceText(String(d))}>
              <span>{d}″</span><strong>{pct(probability, 0)}</strong>
            </button>
          ))}
        </div>
      </div>}

      <details className="charge-help">
        <summary>Reglas y cálculo</summary>
        <p>Introduce la distancia completa, sin descontar el alcance de enfrentamiento. Puedes usar decimales.</p>
        <p>Activa la repetición o el modificador solo si una regla lo permite. La repetición tira ambos dados una vez; la tirada modificada queda entre 1 y 12.</p>
        <p>Un 6 observado solo condiciona la primera tirada. Al repetir, ese 6 se pierde.</p>
        <p>La unidad debe poder cargar y completar el recorrido. Avanzar, retirarse o estar trabado normalmente impide cargar. No se resuelven alturas, terreno ni cargas múltiples.</p>
        <p>Sin repetir: P(2D6 + modificador alcanza la distancia). Con repetición: p + (1 − p) × p. Con un 6 observado: p6 + (1 − p6) × p2. La tabla redondea los porcentajes.</p>
      </details>
    </section>
  );
}
