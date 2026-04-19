import { useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { InputField } from '../../components/InputField';
import { ResultBox } from '../../components/ResultBox';
import { useHypergeometric } from './useHypergeometric';
import { colors } from '../../styles/tokens';

function pct(v: number): string { return (v * 100).toFixed(2) + '%'; }
function fmt(v: number): string { return v.toFixed(3); }

/**
 * Calculadora de la distribución hipergeométrica.
 *
 * SRP: solo gestiona los inputs del usuario y delega el cálculo al hook.
 * El componente no sabe nada del dominio — recibe primitivos del view model.
 */
export function HypergeometricCalculator() {
  const [N, setN] = useState(60);
  const [K, setK] = useState(4);
  const [n, setN2] = useState(7);
  const [k, setK2] = useState(1);

  const vm = useHypergeometric({ N, K, n, k });

  return (
    <SectionCard
      title="Probabilidad hipergeométrica — Cartas"
      formula={
        'P(X = k) = C(K, k) × C(N−K, n−k) / C(N, n)\n' +
        '\n' +
        'donde:\n' +
        '  N = tamaño del mazo     K = copias en el mazo\n' +
        '  n = cartas robadas      k = éxitos deseados'
      }
      explanation={
        'Modela el robo sin reposición de un mazo finito. A diferencia de la binomial ' +
        '(donde cada intento es independiente con la misma p), aquí cada carta que sacas ' +
        'cambia lo que queda, así que los intentos NO son independientes. ' +
        'Es la distribución correcta para preguntas como «¿qué probabilidad hay de tener ' +
        'al menos 1 copia de esta carta en la mano inicial de 7 cartas?».'
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
        <InputField label="Tamaño del mazo (N)" value={N} onChange={setN} min={1} />
        <InputField label="Copias en el mazo (K)" value={K} onChange={v => setK(Math.min(v, N))} min={0} max={N} />
        <InputField label="Cartas robadas (n)" value={n} onChange={v => setN2(Math.min(v, N))} min={1} max={N} />
        <InputField label="Copias deseadas (k)" value={k} onChange={v => setK2(Math.min(v, K))} min={0} max={K} />
      </div>

      {vm.error ? (
        <div style={{ color: colors.error, fontSize: '0.8rem' }}>{vm.error}</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <ResultBox label="P(X = k)  exacta" value={pct(vm.exact)} />
            <ResultBox label="P(X ≥ k)  al menos" value={pct(vm.atLeast)} highlight />
            <ResultBox label="P(X ≤ k)  como máximo" value={pct(vm.atMost)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <ResultBox label="Media  E[X]" value={fmt(vm.mean)} />
            <ResultBox label="Desviación típica  σ" value={fmt(vm.stdDev)} />
          </div>
        </>
      )}
    </SectionCard>
  );
}
