import { useId, useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { ResultBox } from '../../components/ResultBox';
import { useCharge } from './useCharge';
import './charge.css';

function pct(value: number): string {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value * 100) + ' %';
}

/** Preserve incomplete drafts and support both decimal separators without rounding. */
function parseDraft(text: string): number {
  const trimmed = text.trim();
  return /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(trimmed) ? Number(trimmed.replace(',', '.')) : NaN;
}

export function ChargeCalculator() {
  const id = useId();
  const [distanceText, setDistanceText] = useState('9');
  const [modifierText, setModifierText] = useState('0');
  const [reroll, setReroll] = useState<'none' | 'failures'>('none');
  const [observedSix, setObservedSix] = useState(false);
  const [contextConfirmed, setContextConfirmed] = useState(false);
  const distance = parseDraft(distanceText);
  const chargeRollModifier = parseDraft(modifierText);
  const distanceInvalid = !Number.isFinite(distance) || distance <= 0;
  const modifierInvalid = !Number.isSafeInteger(chargeRollModifier);
  const vm = useCharge({ distance, reroll, observedSix, chargeRollModifier });
  const showResult = contextConfirmed && vm.status === 'ready' && vm.currentProbability !== null;

  return (
    <SectionCard
      title="Distancia de carga — Warhammer 40K · 11.ª edición"
      compact
      scopeLabel="Un objetivo · 2D6 · distancia suficiente, condicionada a una carga legal y un movimiento viable."
      formula={
        'P(distancia suficiente) = P(min(12, max(1, 2D6 + modificador)) ≥ distancia medida).\n' +
        'Repetición completa de tiradas insuficientes: p + (1 − p) × p.\n' +
        'Con un 6 observado: p6 + (1 − p6) × p2; la repetición vuelve a 2D6.'
      }
      explanation={
        'El objetivo se selecciona después de tirar: debe estar dentro de 12″ y de la distancia máxima obtenida. ' +
        'No se descuenta el alcance de enfrentamiento de la distancia medida. Sin modificadores, un doble 1 no permite completar una carga. ' +
        'El alcance de enfrentamiento es 2″ horizontal y 5″ vertical. Una distancia suficiente no certifica superar terreno, ' +
        'cumplir coherencia ni acabar trabado con todos los objetivos y con ningún enemigo adicional. ' +
        'Esta herramienta cubre una carga estándar; no resuelve alturas, cargas múltiples ni efectos que cambian la distancia máxima del movimiento.'
      }
    >
      <div className="charge-fields">
        <div className="charge-field">
          <label htmlFor={id + '-distance'}>Distancia medida al objetivo (″)</label>
          <input
            id={id + '-distance'}
            type="text"
            inputMode="decimal"
            value={distanceText}
            onChange={event => setDistanceText(event.target.value)}
            aria-invalid={distanceInvalid || undefined}
            aria-describedby={id + '-distance-help' + (distanceInvalid ? ' ' + id + '-error' : '')}
          />
          <small id={id + '-distance-help'}>Introduce la medida completa, con decimales si hace falta: 9,1″ exige un 10.</small>
        </div>
        <div className="charge-field">
          <label htmlFor={id + '-modifier'}>Modificador de la tirada</label>
          <input
            id={id + '-modifier'}
            type="text"
            inputMode="text"
            value={modifierText}
            onChange={event => setModifierText(event.target.value)}
            aria-invalid={modifierInvalid || undefined}
            aria-describedby={id + '-modifier-help' + (modifierInvalid ? ' ' + id + '-error' : '')}
          />
          <small id={id + '-modifier-help'}>Suma o resta un entero solo si una regla lo permite. La tirada final queda entre 1 y 12. No incluye efectos sobre la distancia del movimiento, como alzar el vuelo.</small>
        </div>
        <div className="charge-field">
          <label htmlFor={id + '-mode'}>Modo de cálculo</label>
          <select id={id + '-mode'} value={observedSix ? 'observedSix' : 'standard'} onChange={event => setObservedSix(event.target.value === 'observedSix')}>
            <option value="standard">Tirada estándar: 2D6</option>
            <option value="observedSix">Un 6 observado; otro dado desconocido</option>
          </select>
        </div>
        <div className="charge-field">
          <label htmlFor={id + '-reroll'}>Repetición de carga</label>
          <select id={id + '-reroll'} value={reroll} onChange={event => setReroll(event.target.value as 'none' | 'failures')} aria-describedby={id + '-reroll-help'}>
            <option value="none">Sin repetir</option>
            <option value="failures">Repetir la tirada completa si no alcanza (con permiso)</option>
          </select>
          <small id={id + '-reroll-help'}>Una sola repetición de ambos dados, antes de modificadores. Requiere permiso de una regla, como la repetición de mando; comprueba su disponibilidad.</small>
        </div>
      </div>

      {observedSix && <p className="charge-note">
        Cálculo condicionado a haber observado un 6: no concede permiso para fijarlo o conservarlo.
        Si repites la carga, vuelves a tirar ambos dados.
      </p>}

      <label className="charge-confirmation">
        <input type="checkbox" checked={contextConfirmed} onChange={event => setContextConfirmed(event.target.checked)} />
        <span>He comprobado que la unidad está sin trabar, puede declarar la carga y tiene un movimiento viable.</span>
      </label>
      <p className="charge-note">
        Avanzar o retirarse normalmente impide cargar, salvo una excepción aplicable. Comprueba el recorrido y las condiciones de cada miniatura.
      </p>

      <div aria-live="polite" aria-atomic="true" className="charge-result">
        {vm.error && <p id={id + '-error'} role="alert" className="charge-error">{vm.error}</p>}
        {vm.status === 'outsideRange' && <p role="status">Objetivo fuera del alcance para seleccionarlo: está a más de 12″. Un bonus a la tirada no amplía ese límite.</p>}
        {vm.status === 'checkEngagement' && <p role="status">Comprueba enfrentamiento y alturas: a 2″ o menos y al mismo nivel ya estarías trabado. Este escenario queda fuera de la carga estándar calculada aquí.</p>}
        {vm.status === 'ready' && !contextConfirmed && <p role="status">Confirma la elegibilidad de la unidad y el movimiento viable para ver la probabilidad.</p>}
        {showResult && <div role="region" aria-label="Resultado de distancia de carga">
          <ResultBox
            label={'Probabilidad de obtener distancia suficiente para ' + distanceText.trim() + '″'}
            value={pct(vm.currentProbability!)}
            highlight
          />
          <p className="charge-note">Condicionada al contexto comprobado. Obtener distancia suficiente no garantiza completar el movimiento.</p>
        </div>}
      </div>

      {showResult && <div role="region" aria-label="Tabla de distancia de carga">
        <p className="charge-note">Referencia 3″–12″ · mismo modificador, modo y repetición · condicionada a una carga legal y un movimiento viable.</p>
        <div className="charge-reference">
          {vm.referenceTable.map(({ distance: d, probability }) => (
            <button key={d} type="button" aria-label={'Elegir distancia de ' + d + ' pulgadas'}
              aria-pressed={d === distance} onClick={() => setDistanceText(String(d))}>
              <span>{d}″</span><strong>{pct(probability)}</strong>
            </button>
          ))}
        </div>
      </div>}
    </SectionCard>
  );
}
