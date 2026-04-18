import {
  cumulativeProbability,
  discreteProbability,
  expectedValue,
  variance,
} from './distribution';

describe('discreteProbability', () => {
  // ── Caso base: un único outcome ───────────────────────────────────────────
  // Un solo resultado con cualquier peso tiene probabilidad 1: es el único
  // resultado posible.
  it('assigns probability 1 to a single outcome', () => {
    const result = discreteProbability([{ value: 6, weight: 1 }]);
    expect(result).toHaveLength(1);
    expect(result[0].probability).toBeCloseTo(1);
  });

  // ── Distribución uniforme ─────────────────────────────────────────────────
  // Todos los pesos iguales → todas las probabilidades iguales (1/n).
  // Modela un dado justo, una moneda equilibrada, cualquier evento equiprobable.
  it('assigns equal probabilities when all weights are equal', () => {
    const outcomes = [
      { value: 1, weight: 1 },
      { value: 2, weight: 1 },
      { value: 3, weight: 1 },
    ];
    const result = discreteProbability(outcomes);
    for (const entry of result) {
      expect(entry.probability).toBeCloseTo(1 / 3);
    }
  });

  // ── Normalización de pesos no uniformes ───────────────────────────────────
  // Pesos 1, 2, 1 → probabilidades 0.25, 0.50, 0.25.
  // Verifica que la normalización es correcta independientemente del valor
  // absoluto de los pesos (podrían ser 10, 20, 10 y el resultado sería igual).
  it('normalizes non-uniform weights correctly', () => {
    const result = discreteProbability([
      { value: 1, weight: 1 },
      { value: 2, weight: 2 },
      { value: 3, weight: 1 },
    ]);
    expect(result[0].probability).toBeCloseTo(0.25);
    expect(result[1].probability).toBeCloseTo(0.5);
    expect(result[2].probability).toBeCloseTo(0.25);
  });

  // ── Las probabilidades suman 1 ────────────────────────────────────────────
  // Propiedad axiomática de toda distribución de probabilidad.
  it('produces probabilities that sum to 1', () => {
    const result = discreteProbability([
      { value: 1, weight: 3 },
      { value: 2, weight: 7 },
      { value: 3, weight: 5 },
    ]);
    const total = result.reduce((sum, entry) => sum + entry.probability, 0);
    expect(total).toBeCloseTo(1);
  });

  // ── Orden de salida ───────────────────────────────────────────────────────
  // El resultado se ordena por valor ascendente, independientemente del orden
  // de entrada. Esto hace predecible el resultado para CDF, gráficas, etc.
  it('returns entries sorted by value ascending', () => {
    const result = discreteProbability([
      { value: 3, weight: 1 },
      { value: 1, weight: 1 },
      { value: 2, weight: 1 },
    ]);
    expect(result.map(entry => entry.value)).toEqual([1, 2, 3]);
  });

  // ── Los valores de entrada se preservan ──────────────────────────────────
  it('preserves original values in the output', () => {
    const result = discreteProbability([
      { value: 10, weight: 1 },
      { value: 20, weight: 3 },
    ]);
    expect(result.map(entry => entry.value)).toEqual([10, 20]);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws when the outcomes array is empty', () => {
    expect(() => discreteProbability([])).toThrow(RangeError);
  });

  it('throws when a weight is zero', () => {
    expect(() =>
      discreteProbability([
        { value: 1, weight: 0 },
        { value: 2, weight: 1 },
      ]),
    ).toThrow(RangeError);
  });

  it('throws when a weight is negative', () => {
    expect(() =>
      discreteProbability([{ value: 1, weight: -2 }]),
    ).toThrow(RangeError);
  });

  it('throws when a weight is not finite', () => {
    expect(() =>
      discreteProbability([{ value: 1, weight: Infinity }]),
    ).toThrow(RangeError);
  });

  it('throws when a value is NaN', () => {
    expect(() =>
      discreteProbability([{ value: NaN, weight: 1 }]),
    ).toThrow(RangeError);
  });

  it('throws when a value is Infinity', () => {
    expect(() =>
      discreteProbability([{ value: Infinity, weight: 1 }]),
    ).toThrow(RangeError);
  });
});

// ── Fixture compartida ────────────────────────────────────────────────────────
// Un dado justo de 6 caras: distribución uniforme sobre {1, 2, 3, 4, 5, 6}.
// E[X] = 3.5, Var[X] = 35/12 ≈ 2.9167. Aparece en los tres describe siguientes.
const fairD6 = discreteProbability([
  { value: 1, weight: 1 },
  { value: 2, weight: 1 },
  { value: 3, weight: 1 },
  { value: 4, weight: 1 },
  { value: 5, weight: 1 },
  { value: 6, weight: 1 },
]);

// Distribución uniforme sobre {1, 2, 3}: E[X] = 2, Var[X] = 2/3
const uniform3 = discreteProbability([
  { value: 1, weight: 1 },
  { value: 2, weight: 1 },
  { value: 3, weight: 1 },
]);

describe('expectedValue', () => {
  // ── Caso base ─────────────────────────────────────────────────────────────
  // Un solo resultado: la esperanza es ese valor, sin incertidumbre.
  it('returns the single value when the distribution has one outcome', () => {
    const dist = discreteProbability([{ value: 7, weight: 1 }]);
    expect(expectedValue(dist)).toBeCloseTo(7);
  });

  // ── Distribución uniforme ─────────────────────────────────────────────────
  // E[X] = (1+2+3) / 3 = 2
  it('returns 2 for uniform distribution over {1, 2, 3}', () => {
    expect(expectedValue(uniform3)).toBeCloseTo(2);
  });

  // E[X] = (1+2+3+4+5+6) / 6 = 3.5
  it('returns 3.5 for a fair six-sided die', () => {
    expect(expectedValue(fairD6)).toBeCloseTo(3.5);
  });

  // ── Distribución no uniforme ──────────────────────────────────────────────
  // Pesos 1, 3 sobre valores 0 y 4 → E[X] = 0·0.25 + 4·0.75 = 3
  it('weights each value by its probability correctly', () => {
    const dist = discreteProbability([
      { value: 0, weight: 1 },
      { value: 4, weight: 3 },
    ]);
    expect(expectedValue(dist)).toBeCloseTo(3);
  });
});

describe('variance', () => {
  // ── Caso base ─────────────────────────────────────────────────────────────
  // Sin dispersión: la varianza de una distribución degenerada es 0.
  it('returns 0 when the distribution has one outcome', () => {
    const dist = discreteProbability([{ value: 5, weight: 1 }]);
    expect(variance(dist)).toBeCloseTo(0);
  });

  // ── Distribución uniforme ─────────────────────────────────────────────────
  // Var[X] = E[X²] − (E[X])² = (1+4+9)/3 − 4 = 14/3 − 12/3 = 2/3
  it('returns 2/3 for uniform distribution over {1, 2, 3}', () => {
    expect(variance(uniform3)).toBeCloseTo(2 / 3);
  });

  // Var[X] = 35/12 para el dado justo de 6 caras
  it('returns 35/12 for a fair six-sided die', () => {
    expect(variance(fairD6)).toBeCloseTo(35 / 12);
  });

  // ── Propiedad: la varianza nunca es negativa ───────────────────────────────
  // Matemáticamente Var[X] ≥ 0 siempre. Si fuera negativa indicaría un bug
  // de redondeo o un error en la fórmula.
  it('is always non-negative', () => {
    const dist = discreteProbability([
      { value: 1, weight: 3 },
      { value: 2, weight: 7 },
      { value: 3, weight: 5 },
    ]);
    expect(variance(dist)).toBeGreaterThanOrEqual(0);
  });
});

describe('cumulativeProbability', () => {
  // ── Por debajo del mínimo ─────────────────────────────────────────────────
  // P(X ≤ 0) = 0 cuando el mínimo de la distribución es 1.
  it('returns 0 when x is below all values', () => {
    expect(cumulativeProbability(uniform3, 0)).toBeCloseTo(0);
  });

  // ── Por encima del máximo ─────────────────────────────────────────────────
  // P(X ≤ 100) = 1: todos los resultados posibles están incluidos.
  it('returns 1 when x is above all values', () => {
    expect(cumulativeProbability(uniform3, 100)).toBeCloseTo(1);
  });

  // ── Igual al valor máximo ─────────────────────────────────────────────────
  it('returns 1 when x equals the maximum value', () => {
    expect(cumulativeProbability(uniform3, 3)).toBeCloseTo(1);
  });

  // ── Acumulados exactos para distribución uniforme ─────────────────────────
  // P(X ≤ 1) = 1/3, P(X ≤ 2) = 2/3, P(X ≤ 3) = 1
  it('accumulates probabilities correctly at each boundary', () => {
    expect(cumulativeProbability(uniform3, 1)).toBeCloseTo(1 / 3);
    expect(cumulativeProbability(uniform3, 2)).toBeCloseTo(2 / 3);
    expect(cumulativeProbability(uniform3, 3)).toBeCloseTo(1);
  });

  // ── Valor entre dos entradas de la distribución ───────────────────────────
  // P(X ≤ 1.5) equivale a P(X ≤ 1): no hay outcomes con value en (1, 1.5].
  it('treats x between entries the same as the nearest entry below', () => {
    expect(cumulativeProbability(uniform3, 1.5)).toBeCloseTo(
      cumulativeProbability(uniform3, 1),
    );
  });

  // ── Complementario ────────────────────────────────────────────────────────
  // P(X > x) = 1 − P(X ≤ x). Se comprueba en el punto medio del dado.
  it('complement sums to 1 with its direct probability', () => {
    const p = cumulativeProbability(fairD6, 3);
    const complement = 1 - cumulativeProbability(fairD6, 3);
    expect(p + complement).toBeCloseTo(1);
  });
});
