import { useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { InputField } from '../../components/InputField';
import { ResultBox } from '../../components/ResultBox';
import { useLorcana } from './useLorcana';
import { colors, sp } from '../../styles/tokens';

function pct(v: number): string { return (v * 100).toFixed(2) + '%'; }
function fmt(v: number): string { return v.toFixed(2); }

/**
 * Calculadora de probabilidades de mazo para Disney Lorcana.
 *
 * Expone tres cálculos clave para la construcción y evaluación de mazos:
 * - Mulligan: P(tener la carta que buscas en la mano inicial)
 * - Curva de ink: P(haber inkeado todos los turnos hasta el turno T)
 * - Ink esperado: E[cartas en inkwell] al final del turno T
 */
export function LorcanaCalculator() {
  // Parámetros para el mulligan
  const [N, setN] = useState(60);
  const [K, setK] = useState(4);
  const [handSize, setHandSize] = useState(7);
  const [k, setK2] = useState(1);

  // Parámetros para la curva de ink
  const [inkableCards, setInkableCards] = useState(40);
  const [turn, setTurn] = useState(4);

  const vm = useLorcana({ N, K, handSize, k, inkableCards, turn });

  return (
    <SectionCard
      title="Disney Lorcana — Probabilidades de mazo"
      formula={
        'Mulligan:    P(≥k en al menos 1 de 2 manos) = 1 − P(X < k)²\n' +
        '             donde P(X < k) = HiperGeométrica(N, K, handSize, k−1)\n' +
        '\n' +
        'Curva ink:   P(on-curve en T) = P(X ≥ T)   X ~ Hyper(N, K_ink, handSize + T)\n' +
        'E[ink en T]: Σ_{t=1}^{T} P(X ≥ t)           (fórmula de la cola)'
      }
      explanation={
        'El mulligan de Lorcana es único: devuelves TODAS las cartas y robas 7 nuevas. ' +
        'Como el mazo se baraja completamente, las dos manos son independientes — ' +
        'P(éxito) = 1 − P(fallo)². Esto mejora mucho la probabilidad en cartas con pocas copias. ' +
        'La curva de ink mide si puedes inkear (pagar recurso) cada turno seguido hasta el turno T: ' +
        'fundamental para saber si tu mazo llega a sus cartas caras a tiempo.'
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.lg }}>

        {/* Mulligan */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: colors.primary,
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Carta objetivo (mulligan)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: sp.md }}>
            <InputField label="Tamaño del mazo (N)" value={N} onChange={setN} min={1} />
            <InputField label="Copias en el mazo (K)" value={K} onChange={v => setK(Math.min(v, N))} min={0} max={N} />
            <InputField label="Cartas en mano (handSize)" value={handSize} onChange={v => setHandSize(Math.min(v, N))} min={1} max={N} />
            <InputField label="Copias deseadas (k)" value={k} onChange={v => setK2(Math.min(v, K))} min={1} max={K} />
          </div>
          <ResultBox label="P(≥k copias con mulligan)" value={pct(vm.mulliganProb)} highlight />
        </div>

        {/* Curva de ink */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: colors.primary,
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Curva de ink
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: sp.md }}>
            <InputField label="Cartas inkable en el mazo" value={inkableCards} onChange={v => setInkableCards(Math.min(v, N))} min={0} max={N} />
            <InputField label="Evaluar hasta el turno T" value={turn} onChange={v => setTurn(Math.max(1, Math.round(v)))} min={1} max={10} />
          </div>
          {vm.error ? (
            <div style={{ color: colors.error, fontSize: '0.8rem' }}>{vm.error}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ResultBox label={`P(on-curve hasta T${turn})`} value={pct(vm.pOnCurve)} highlight />
              <ResultBox label={`E[ink] al final de T${turn}`} value={fmt(vm.expectedInk)} />
            </div>
          )}
        </div>

      </div>
    </SectionCard>
  );
}
