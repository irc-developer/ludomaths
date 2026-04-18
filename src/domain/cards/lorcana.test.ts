import { mulliganAtLeast } from './lorcana';

// ─────────────────────────────────────────────────────────────────────────────
// mulliganAtLeast — P(ver al menos k copias después del mulligan de Lorcana)
//
// Regla de Lorcana: si no estás satisfecho con tu mano inicial de `handSize`
// cartas, puedes devolverlas todas al mazo barajado y robar una nueva mano del
// mismo tamaño. Las dos manos son independientes e idénticas porque se barajea
// antes de cada robo.
//
// P(ver al menos k en al menos una de las dos manos)
//   = 1 − P(no ver k en la primera mano)²
//   = 1 − (P(X < k))²
//   = 1 − hypergeometricAtMost(N, K, handSize, k-1)²
// ─────────────────────────────────────────────────────────────────────────────
describe('mulliganAtLeast', () => {
  // Sin mulligan (keepFirst=true) y con mulligan, si k=0, la probabilidad es 1.
  it('returns 1 when k=0 (trivially true)', () => {
    expect(mulliganAtLeast(60, 4, 7, 0)).toBeCloseTo(1);
  });

  // Caso Lorcana documentado: 4 copias en 60, mano de 7.
  // P(al menos 1 con una mano) ≈ 0.400.
  // P(no ver 1 en una mano) = P(X=0) ≈ 0.600.
  // Con mulligan: 1 − 0.600² = 1 − 0.360 = 0.640.
  it('returns ~0.64 for at-least-1 with 4 copies, hand of 7, after mulligan', () => {
    expect(mulliganAtLeast(60, 4, 7, 1)).toBeCloseTo(0.64, 1);
  });

  // El mulligan siempre mejora o iguala la probabilidad (nunca empeora).
  it('is always ≥ single-hand probability', () => {
    // hypergeometricAtLeast(60, 4, 7, 1) ≈ 0.40; mulligan ≈ 0.64.
    const singleHand = 0.4; // aproximado
    expect(mulliganAtLeast(60, 4, 7, 1)).toBeGreaterThanOrEqual(singleHand - 0.01);
  });

  // Si k > min(K, handSize), es imposible en cualquier mano → P = 0.
  it('returns 0 when k > min(K, handSize)', () => {
    expect(mulliganAtLeast(60, 4, 7, 5)).toBeCloseTo(0);
  });

  // Verificación numérica exacta: N=4, K=2, handSize=2, k=2.
  // P(X=2 en una mano) = C(2,2)*C(2,0)/C(4,2) = 1/6.
  // P(no ver 2) = 5/6 → P(mulligan) = 1 − (5/6)² = 1 − 25/36 = 11/36 ≈ 0.3056.
  it('returns 11/36 for N=4, K=2, handSize=2, k=2', () => {
    expect(mulliganAtLeast(4, 2, 2, 2)).toBeCloseTo(11 / 36, 4);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws when K > N', () => {
    expect(() => mulliganAtLeast(5, 6, 3, 1)).toThrow(RangeError);
  });

  it('throws when handSize > N', () => {
    expect(() => mulliganAtLeast(5, 2, 6, 1)).toThrow(RangeError);
  });
});
