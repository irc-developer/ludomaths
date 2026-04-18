import { binomialCoefficient } from './combinatorics';

describe('binomialCoefficient', () => {
  // ── Casos base / identidades ──────────────────────────────────────────────
  // C(n, 0) = 1  para todo n ≥ 0: hay exactamente una forma de elegir 0 elementos
  it('returns 1 when k is 0', () => {
    expect(binomialCoefficient(5, 0)).toBe(1);
    expect(binomialCoefficient(0, 0)).toBe(1);
  });

  // C(n, n) = 1: hay exactamente una forma de elegir todos los elementos
  it('returns 1 when k equals n', () => {
    expect(binomialCoefficient(5, 5)).toBe(1);
  });

  // C(1, 1) = 1
  it('returns 1 for C(1, 1)', () => {
    expect(binomialCoefficient(1, 1)).toBe(1);
  });

  // ── Resultados conocidos ──────────────────────────────────────────────────
  // C(5, 2) = 10
  it('returns 10 for C(5, 2)', () => {
    expect(binomialCoefficient(5, 2)).toBe(10);
  });

  // C(10, 3) = 120
  it('returns 120 for C(10, 3)', () => {
    expect(binomialCoefficient(10, 3)).toBe(120);
  });

  // C(52, 5) = 2 598 960  (mano de 5 cartas de una baraja estándar)
  it('returns 2598960 for C(52, 5)', () => {
    expect(binomialCoefficient(52, 5)).toBe(2598960);
  });

  // ── Propiedad de simetría  C(n, k) = C(n, n-k) ───────────────────────────
  it('satisfies symmetry: C(n, k) === C(n, n-k)', () => {
    expect(binomialCoefficient(8, 3)).toBe(binomialCoefficient(8, 5));
    expect(binomialCoefficient(10, 2)).toBe(binomialCoefficient(10, 8));
  });

  // ── Propiedad aditiva (Regla de Pascal): C(n,k) = C(n-1,k-1) + C(n-1,k) ─
  it('satisfies Pascal rule: C(n,k) === C(n-1,k-1) + C(n-1,k)', () => {
    const n = 7;
    const k = 3;
    expect(binomialCoefficient(n, k)).toBe(
      binomialCoefficient(n - 1, k - 1) + binomialCoefficient(n - 1, k),
    );
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws when k > n', () => {
    expect(() => binomialCoefficient(3, 5)).toThrow(RangeError);
  });

  it('throws when n is negative', () => {
    expect(() => binomialCoefficient(-1, 0)).toThrow(RangeError);
  });

  it('throws when k is negative', () => {
    expect(() => binomialCoefficient(5, -1)).toThrow(RangeError);
  });

  it('throws when n or k are non-integer', () => {
    expect(() => binomialCoefficient(5.5, 2)).toThrow(RangeError);
    expect(() => binomialCoefficient(5, 2.3)).toThrow(RangeError);
  });
});
