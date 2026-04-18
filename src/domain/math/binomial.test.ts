import { binomialDistribution, binomialProbability } from './binomial';

describe('binomialProbability', () => {
  // ── Casos base ────────────────────────────────────────────────────────────
  // n=1, k=1: un único ensayo con probabilidad p. P(X=1) = p.
  it('returns p for n=1, k=1', () => {
    expect(binomialProbability(1, 1, 0.7)).toBeCloseTo(0.7);
  });

  // n=1, k=0: P(X=0) = 1 - p.
  it('returns 1-p for n=1, k=0', () => {
    expect(binomialProbability(1, 0, 0.7)).toBeCloseTo(0.3);
  });

  // k=0: P(X=0) = (1-p)^n. Nadie acierta en ningún ensayo.
  it('returns (1-p)^n when k=0', () => {
    expect(binomialProbability(4, 0, 0.5)).toBeCloseTo(0.0625);
  });

  // k=n: P(X=n) = p^n. Todos los ensayos son éxitos.
  it('returns p^n when k equals n', () => {
    expect(binomialProbability(4, 4, 0.5)).toBeCloseTo(0.0625);
  });

  // ── Resultados conocidos ──────────────────────────────────────────────────
  // P(X=2 | n=4, p=0.5) = C(4,2) * 0.5^2 * 0.5^2 = 6 * 0.25 * 0.25 = 0.375
  it('returns 0.375 for n=4, k=2, p=0.5', () => {
    expect(binomialProbability(4, 2, 0.5)).toBeCloseTo(0.375);
  });

  // ── Todas las probabilidades suman 1 ─────────────────────────────────────
  // Para cualquier n y p, la suma de P(X=k) para k=0..n debe ser 1.
  it('probabilities over all k sum to 1', () => {
    const n = 5;
    const p = 0.3;
    let total = 0;
    for (let k = 0; k <= n; k++) {
      total += binomialProbability(n, k, p);
    }
    expect(total).toBeCloseTo(1);
  });

  // ── Simetría con respecto a p y 1-p ──────────────────────────────────────
  // P(X=k | n, p) = P(X=n-k | n, 1-p). Si robar k cartas con probabilidad p
  // es lo mismo que no robarlas n-k veces con probabilidad 1-p.
  it('satisfies symmetry: P(k|n,p) === P(n-k|n,1-p)', () => {
    expect(binomialProbability(6, 2, 0.4)).toBeCloseTo(
      binomialProbability(6, 4, 0.6),
    );
  });

  // ── Probabilidades extremas ───────────────────────────────────────────────
  // p=0: imposible tener éxito, así que P(X=k>0) = 0 y P(X=0) = 1.
  it('returns 1 for k=0 when p=0', () => {
    expect(binomialProbability(5, 0, 0)).toBeCloseTo(1);
  });

  it('returns 0 for k>0 when p=0', () => {
    expect(binomialProbability(5, 3, 0)).toBeCloseTo(0);
  });

  // p=1: el éxito es seguro, P(X=n) = 1 y P(X<n) = 0.
  it('returns 1 for k=n when p=1', () => {
    expect(binomialProbability(5, 5, 1)).toBeCloseTo(1);
  });

  it('returns 0 for k<n when p=1', () => {
    expect(binomialProbability(5, 3, 1)).toBeCloseTo(0);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws when k > n', () => {
    expect(() => binomialProbability(3, 5, 0.5)).toThrow(RangeError);
  });

  it('throws when n is negative', () => {
    expect(() => binomialProbability(-1, 0, 0.5)).toThrow(RangeError);
  });

  it('throws when n or k are non-integer', () => {
    expect(() => binomialProbability(3.5, 2, 0.5)).toThrow(RangeError);
  });

  it('throws when p < 0', () => {
    expect(() => binomialProbability(5, 2, -0.1)).toThrow(RangeError);
  });

  it('throws when p > 1', () => {
    expect(() => binomialProbability(5, 2, 1.1)).toThrow(RangeError);
  });
});

describe('binomialDistribution', () => {
  // ── Casos base ────────────────────────────────────────────────────────────
  // n=0: el único resultado posible es 0 éxitos.
  it('returns [{value:0, probability:1}] for n=0', () => {
    const dist = binomialDistribution(0, 0.5);
    expect(dist).toHaveLength(1);
    expect(dist[0].value).toBe(0);
    expect(dist[0].probability).toBeCloseTo(1);
  });

  // n+1 entradas para cualquier n con p intermedia (todas las probabilidades > 0).
  it('returns n+1 entries for general n and p', () => {
    expect(binomialDistribution(4, 0.5)).toHaveLength(5);
    expect(binomialDistribution(6, 0.3)).toHaveLength(7);
  });

  // Los valores van de 0 a n en orden ascendente.
  it('returns values 0..n sorted ascending', () => {
    const dist = binomialDistribution(3, 0.5);
    expect(dist.map(e => e.value)).toEqual([0, 1, 2, 3]);
  });

  // ── Las probabilidades suman 1 ────────────────────────────────────────────
  it('probabilities sum to 1', () => {
    const dist = binomialDistribution(5, 0.3);
    const total = dist.reduce((sum, e) => sum + e.probability, 0);
    expect(total).toBeCloseTo(1);
  });

  // ── Consistencia con binomialProbability ──────────────────────────────────
  // Cada entrada de la distribución debe coincidir con la PMF individual.
  it('matches individual binomialProbability calls', () => {
    const n = 4, p = 0.6;
    const dist = binomialDistribution(n, p);
    for (let k = 0; k <= n; k++) {
      expect(dist[k].probability).toBeCloseTo(binomialProbability(n, k, p));
    }
  });

  // ── Casos extremos de p ───────────────────────────────────────────────────
  // p=0: imposible tener éxitos. Distribución degenerada en 0.
  it('returns degenerate distribution at 0 for p=0', () => {
    const dist = binomialDistribution(5, 0);
    expect(dist).toHaveLength(1);
    expect(dist[0].value).toBe(0);
    expect(dist[0].probability).toBeCloseTo(1);
  });

  // p=1: todos los ensayos son éxito. Distribución degenerada en n.
  it('returns degenerate distribution at n for p=1', () => {
    const n = 4;
    const dist = binomialDistribution(n, 1);
    expect(dist).toHaveLength(1);
    expect(dist[0].value).toBe(n);
    expect(dist[0].probability).toBeCloseTo(1);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws for non-integer n', () => {
    expect(() => binomialDistribution(3.5, 0.5)).toThrow(RangeError);
  });

  it('throws for negative n', () => {
    expect(() => binomialDistribution(-1, 0.5)).toThrow(RangeError);
  });

  it('throws for p outside [0, 1]', () => {
    expect(() => binomialDistribution(5, 1.5)).toThrow(RangeError);
    expect(() => binomialDistribution(5, -0.1)).toThrow(RangeError);
  });
});
