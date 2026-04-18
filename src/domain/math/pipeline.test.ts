import { applyDamage, applyStage } from './pipeline';
import { discreteProbability } from './distribution';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const fairD6 = discreteProbability([
  { value: 1, weight: 1 },
  { value: 2, weight: 1 },
  { value: 3, weight: 1 },
  { value: 4, weight: 1 },
  { value: 5, weight: 1 },
  { value: 6, weight: 1 },
]);

describe('applyStage', () => {
  // ── Distribución degenerada como entrada ──────────────────────────────────
  // Si el número de intentos es fijo (n), el resultado debe coincidir
  // exactamente con binomialDistribution(n, p).
  it('matches binomialDistribution when trialsDist is degenerate at n', () => {
    const trialsDist = discreteProbability([{ value: 2, weight: 1 }]);
    const result = applyStage(trialsDist, 0.5);
    expect(result.find(e => e.value === 0)?.probability).toBeCloseTo(0.25);
    expect(result.find(e => e.value === 1)?.probability).toBeCloseTo(0.5);
    expect(result.find(e => e.value === 2)?.probability).toBeCloseTo(0.25);
  });

  // ── p=0: ningún intento tiene éxito → degenera en 0 ──────────────────────
  it('returns degenerate distribution at 0 when p=0', () => {
    const result = applyStage(fairD6, 0);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(0);
    expect(result[0].probability).toBeCloseTo(1);
  });

  // ── p=1: todos los intentos tienen éxito → la distribución de éxitos ─────
  // es idéntica a la distribución de intentos.
  it('returns the same distribution of values as trialsDist when p=1', () => {
    const trialsDist = discreteProbability([
      { value: 2, weight: 1 },
      { value: 4, weight: 1 },
    ]);
    const result = applyStage(trialsDist, 1);
    expect(result.find(e => e.value === 2)?.probability).toBeCloseTo(0.5);
    expect(result.find(e => e.value === 4)?.probability).toBeCloseTo(0.5);
  });

  // ── Las probabilidades suman 1 ────────────────────────────────────────────
  it('produces probabilities that sum to 1', () => {
    const trialsDist = discreteProbability([
      { value: 3, weight: 1 },
      { value: 5, weight: 2 },
    ]);
    const result = applyStage(trialsDist, 0.4);
    const total = result.reduce((sum, e) => sum + e.probability, 0);
    expect(total).toBeCloseTo(1);
  });

  // ── Máximo posible de éxitos nunca supera el máximo de intentos ───────────
  it('never produces more successes than the maximum number of trials', () => {
    const trialsDist = discreteProbability([
      { value: 2, weight: 1 },
      { value: 3, weight: 1 },
    ]);
    const result = applyStage(trialsDist, 0.7);
    const maxValue = Math.max(...result.map(e => e.value));
    expect(maxValue).toBeLessThanOrEqual(3);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws when p is outside [0, 1]', () => {
    const dist = discreteProbability([{ value: 2, weight: 1 }]);
    expect(() => applyStage(dist, 1.1)).toThrow(RangeError);
    expect(() => applyStage(dist, -0.1)).toThrow(RangeError);
  });
});

describe('applyDamage', () => {
  // ── Cero heridas → cero daño total ───────────────────────────────────────
  // No importa cuánto daño haga el arma: si no hay heridas, no hay daño.
  it('returns degenerate at 0 when woundDist is degenerate at 0', () => {
    const woundDist = [{ value: 0, probability: 1 }];
    const result = applyDamage(woundDist, fairD6);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(0);
    expect(result[0].probability).toBeCloseTo(1);
  });

  // ── Caso determinista: k heridas con daño fijo d → k*d total ─────────────
  it('returns degenerate at k*d when both distributions are degenerate', () => {
    const woundDist = [{ value: 2, probability: 1 }];
    const damageDist = [{ value: 3, probability: 1 }];
    const result = applyDamage(woundDist, damageDist);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(6);
    expect(result[0].probability).toBeCloseTo(1);
  });

  // ── Distribución correcta con daño variable ───────────────────────────────
  // 2 heridas × daño en {1,2} igualmente probables:
  // Suma de dos variables independientes → {2:0.25, 3:0.5, 4:0.25}
  it('produces the convolution of damage for a fixed wound count', () => {
    const woundDist = [{ value: 2, probability: 1 }];
    const damageDist = discreteProbability([
      { value: 1, weight: 1 },
      { value: 2, weight: 1 },
    ]);
    const result = applyDamage(woundDist, damageDist);
    expect(result.find(e => e.value === 2)?.probability).toBeCloseTo(0.25);
    expect(result.find(e => e.value === 3)?.probability).toBeCloseTo(0.5);
    expect(result.find(e => e.value === 4)?.probability).toBeCloseTo(0.25);
  });

  // ── Las probabilidades suman 1 ────────────────────────────────────────────
  it('produces probabilities that sum to 1', () => {
    const woundDist = discreteProbability([
      { value: 0, weight: 1 },
      { value: 1, weight: 2 },
      { value: 2, weight: 1 },
    ]);
    const result = applyDamage(woundDist, fairD6);
    const total = result.reduce((sum, e) => sum + e.probability, 0);
    expect(total).toBeCloseTo(1);
  });
});
