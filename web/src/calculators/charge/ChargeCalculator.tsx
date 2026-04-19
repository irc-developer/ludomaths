import { useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { InputField } from '../../components/InputField';
import { ResultBox } from '../../components/ResultBox';
import { useCharge } from './useCharge';
import { colors, sp } from '../../styles/tokens';

function pct(v: number, d = 1): string { return (v * 100).toFixed(d) + '%'; }

/**
 * Calculadora de probabilidad de carga de WH40K.
 *
 * Muestra la probabilidad de la distancia actual y una tabla de referencia
 * de todas las distancias 2"–13" para facilitar la comparación.
 */
export function ChargeCalculator() {
  const [distance, setDistance] = useState(9);
  const [reroll, setReroll] = useState<'none' | 'failures'>('none');
  const [lockedSix, setLockedSix] = useState(false);

  const vm = useCharge({ distance, reroll, lockedSix });

  return (
    <SectionCard
      title="Probabilidad de carga — Warhammer 40K"
      formula={
        'P(éxito) = P(2D6 ≥ d) = 1 − F_2D6(d − 1)\n' +
        '\n' +
        'La distribución de 2D6 es triangular: el 7 es el valor más probable (1/6).\n' +
        'Cada pulgada extra de distancia reduce la probabilidad de forma no lineal.'
      }
      explanation={
        'En WH40K, una carga tiene éxito si el resultado de 2D6 es ≥ la distancia al objetivo. ' +
        'Una carga de 7" tiene un 58% de éxito, pero con 9" baja al 28% — un riesgo real. ' +
        'Si la unidad puede repetir dados de fallos (p. ej. por un Señor de la Guerra), ' +
        'la probabilidad sube considerablemente, sobre todo a distancias largas. ' +
        'Con un dado fijo en 6, la tirada efectiva es D6+6: distancias ≤7" son garantizadas, pero 8"–12" aún dependen del otro dado.'
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <InputField
          label='Distancia al objetivo (")'
          value={distance}
          onChange={v => setDistance(Math.round(Math.max(2, Math.min(13, v))))}
          min={2}
          max={13}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: colors.muted }}>Repetir dados</label>
          <select
            value={reroll}
            onChange={e => setReroll(e.target.value as 'none' | 'failures')}
            style={{
              background: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              color: colors.text,
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
            }}
          >
            <option value="none">Sin repetir</option>
            <option value="failures">Repetir fallos</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <input
          type="checkbox"
          id="lockedSix"
          checked={lockedSix}
          onChange={e => setLockedSix(e.target.checked)}
        />
        <label htmlFor="lockedSix" style={{ fontSize: '0.75rem', color: colors.muted }}>
          Ya tengo un 6 en uno de los dados (tirada efectiva: D6+6)
        </label>
      </div>

      {vm.error ? (
        <div style={{ color: colors.error, fontSize: '0.8rem', marginBottom: sp.md }}>{vm.error}</div>
      ) : (
        <div style={{ marginBottom: '1.25rem' }}>
          <ResultBox
            label={`P(carga exitosa desde ${distance}")`}
            value={pct(vm.currentProbability, 2)}
            highlight
          />
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: colors.muted, marginBottom: '0.5rem' }}>
        Tabla de referencia — todas las distancias
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
        {vm.referenceTable.map(({ distance: d, probability }) => {
          const isActive = d === distance;
          return (
            <button
              key={d}
              onClick={() => setDistance(d)}
              style={{
                background: isActive ? colors.primary : colors.surfaceAlt,
                borderRadius: 6,
                padding: '0.4rem 0.2rem',
                textAlign: 'center',
                border: `1px solid ${isActive ? colors.primary : colors.border}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: isActive ? colors.bg : colors.muted }}>
                {d}"
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isActive ? colors.bg : colors.primaryLight,
                }}
              >
                {pct(probability, 0)}
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
