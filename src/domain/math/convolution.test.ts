import { convolve, multiConvolve } from './convolution';
import { discreteProbability } from './distribution';

// Fixtures
const coinFlip = discreteProbability([
  { value: 0, weight: 1 },
  { value: 1, weight: 1 },
]);

const fairD6 = discreteProbability([
  { value: 1, weight: 1 },
  { value: 2, weight: 1 },
  { value: 3, weight: 1 },
  { value: 4, weight: 1 },
  { value: 5, weight: 1 },
  { value: 6, weight: 1 },
]);

describe('convolve', () => {
  // ── Valores alcanzables ───────────────────────────────────────────────────
  // La convolución de dos dados D6 produce valores en [2, 12].
  // Un resultado fuera de ese rango no debe aparecer en la distribución.
  it('produces only values in [min_a + min_b, max_a + max_b]', () => {
    const twoD6 = convolve(fairD6, fairD6);
    const values = twoD6.map(entry => entry.value);
    expect(Math.min(...values)).toBe(2);
    expect(Math.max(...values)).toBe(12);
  });

  // ── Número de resultados distintos ───────────────────────────────────────
  // Dos D6 producen 11 sumas distintas (2 a 12).
  it('produces 11 distinct values for two D6', () => {
    const twoD6 = convolve(fairD6, fairD6);
    expect(twoD6).toHaveLength(11);
  });

  // ── Las probabilidades suman 1 ────────────────────────────────────────────
  it('produces probabilities that sum to 1', () => {
    const twoD6 = convolve(fairD6, fairD6);
    const total = twoD6.reduce((sum, entry) => sum + entry.probability, 0);
    expect(total).toBeCloseTo(1);
  });

  // ── Resultado conocido: dos D6 ────────────────────────────────────────────
  // P(suma=7) = 6/36 = 1/6 ≈ 0.1667: el más probable de 2D6.
  it('returns 1/6 for sum=7 with two D6', () => {
    const twoD6 = convolve(fairD6, fairD6);
    const entry = twoD6.find(e => e.value === 7);
    expect(entry?.probability).toBeCloseTo(1 / 6);
  });

  // P(suma=2) = 1/36 ≈ 0.0278: solo un único camino (1+1).
  it('returns 1/36 for sum=2 with two D6', () => {
    const twoD6 = convolve(fairD6, fairD6);
    const entry = twoD6.find(e => e.value === 2);
    expect(entry?.probability).toBeCloseTo(1 / 36);
  });

  // ── Resultado conocido: dos monedas ──────────────────────────────────────
  // coinFlip ∈ {0,1}. Suma de dos: P(0)=0.25, P(1)=0.5, P(2)=0.25.
  it('returns correct distribution for two coin flips', () => {
    const twoCoins = convolve(coinFlip, coinFlip);
    const p0 = twoCoins.find(e => e.value === 0)?.probability ?? 0;
    const p1 = twoCoins.find(e => e.value === 1)?.probability ?? 0;
    const p2 = twoCoins.find(e => e.value === 2)?.probability ?? 0;
    expect(p0).toBeCloseTo(0.25);
    expect(p1).toBeCloseTo(0.5);
    expect(p2).toBeCloseTo(0.25);
  });

  // ── Propiedad de conmutatividad  A ⊕ B = B ⊕ A ───────────────────────────
  // El orden de los operandos no debe afectar al resultado.
  it('is commutative: convolve(A, B) equals convolve(B, A)', () => {
    const ab = convolve(coinFlip, fairD6);
    const ba = convolve(fairD6, coinFlip);
    expect(ab.map(e => e.value)).toEqual(ba.map(e => e.value));
    ab.forEach((entry, i) => {
      expect(entry.probability).toBeCloseTo(ba[i].probability);
    });
  });

  // ── El resultado está ordenado por valor ──────────────────────────────────
  it('returns entries sorted by value ascending', () => {
    const twoD6 = convolve(fairD6, fairD6);
    const values = twoD6.map(e => e.value);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  // ── Elemento neutro ───────────────────────────────────────────────────────
  // Convolucionar con una distribución degenerada en 0 no cambia nada.
  // Es el equivalente de sumar 0: todos los valores se desplazan 0.
  it('acts as identity when one distribution is degenerate at 0', () => {
    const zero = discreteProbability([{ value: 0, weight: 1 }]);
    const result = convolve(fairD6, zero);
    expect(result.map(e => e.value)).toEqual(fairD6.map(e => e.value));
    result.forEach((entry, i) => {
      expect(entry.probability).toBeCloseTo(fairD6[i].probability);
    });
  });
});

describe('multiConvolve', () => {
  // ── times=0: elemento neutro de la suma (sumar 0 veces da 0) ──────────────
  it('returns degenerate distribution at 0 for times=0', () => {
    const result = multiConvolve(fairD6, 0);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ value: 0, probability: 1 });
  });

  // ── times=1: la distribución consigo misma ────────────────────────────────
  it('returns the original distribution for times=1', () => {
    const result = multiConvolve(coinFlip, 1);
    expect(result).toHaveLength(coinFlip.length);
    result.forEach((entry, i) => {
      expect(entry.value).toBe(coinFlip[i].value);
      expect(entry.probability).toBeCloseTo(coinFlip[i].probability);
    });
  });

  // ── times=2: equivalente a convolve(dist, dist) ───────────────────────────
  it('equals convolve(dist, dist) for times=2', () => {
    const multi = multiConvolve(fairD6, 2);
    const direct = convolve(fairD6, fairD6);
    expect(multi).toHaveLength(direct.length);
    multi.forEach((entry, i) => {
      expect(entry.value).toBe(direct[i].value);
      expect(entry.probability).toBeCloseTo(direct[i].probability);
    });
  });

  // ── Rango de valores: 3D6 produce sumas en [3, 18] ────────────────────────
  it('produces values in [3, 18] for 3D6', () => {
    const threeD6 = multiConvolve(fairD6, 3);
    const values = threeD6.map(e => e.value);
    expect(Math.min(...values)).toBe(3);
    expect(Math.max(...values)).toBe(18);
  });

  // ── Las probabilidades suman 1 ────────────────────────────────────────────
  it('probabilities sum to 1', () => {
    const result = multiConvolve(fairD6, 4);
    const total = result.reduce((sum, e) => sum + e.probability, 0);
    expect(total).toBeCloseTo(1);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws for negative times', () => {
    expect(() => multiConvolve(fairD6, -1)).toThrow(RangeError);
  });

  it('throws for non-integer times', () => {
    expect(() => multiConvolve(fairD6, 1.5)).toThrow(RangeError);
  });
});
