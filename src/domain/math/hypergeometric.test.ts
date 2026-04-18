import { hypergeometricProbability } from './hypergeometric';

describe('hypergeometricProbability', () => {
  // ── Casos base ────────────────────────────────────────────────────────────
  // Robar 1 carta de un mazo de 1: P(X=1) = 1 si esa carta es la buscada.
  it('returns 1 when the whole deck is the target and we draw it all', () => {
    expect(hypergeometricProbability(1, 1, 1, 1)).toBeCloseTo(1);
  });

  // Si no hay copias de la carta (K=0), P(X=0) = 1 y P(X>0) = 0.
  it('returns 1 for k=0 when there are no copies in the deck', () => {
    expect(hypergeometricProbability(10, 0, 5, 0)).toBeCloseTo(1);
  });

  // k=1 con K=0: no hay copias, es imposible obtenerla. P = 0, no error.
  it('returns 0 for k=1 when there are no copies in the deck', () => {
    expect(hypergeometricProbability(10, 0, 5, 1)).toBeCloseTo(0);
  });

  // ── Resultados conocidos ──────────────────────────────────────────────────
  // Mazo de 52, 4 ases, robamos 5 cartas.
  // P(X=0) = C(4,0)*C(48,5) / C(52,5) ≈ 0.6588
  it('returns ~0.6588 for 0 aces in a 5-card hand from a standard deck', () => {
    expect(hypergeometricProbability(52, 4, 5, 0)).toBeCloseTo(0.6588, 3);
  });

  // P(X=1) = C(4,1)*C(48,4) / C(52,5) ≈ 0.2995
  it('returns ~0.2995 for exactly 1 ace in a 5-card hand', () => {
    expect(hypergeometricProbability(52, 4, 5, 1)).toBeCloseTo(0.2995, 3);
  });

  // Caso pequeño verificable a mano:
  // N=4, K=2, n=2, k=1: P = C(2,1)*C(2,1)/C(4,2) = 4/6 ≈ 0.6667
  it('returns 2/3 for N=4, K=2, n=2, k=1', () => {
    expect(hypergeometricProbability(4, 2, 2, 1)).toBeCloseTo(2 / 3);
  });

  // ── Todas las probabilidades suman 1 ─────────────────────────────────────
  // Para N=10, K=3, n=4: k puede ser 0, 1, 2 o 3 (min(K,n) = 3).
  it('probabilities over all valid k sum to 1', () => {
    const N = 10, K = 3, n = 4;
    let total = 0;
    for (let k = 0; k <= Math.min(K, n); k++) {
      total += hypergeometricProbability(N, K, n, k);
    }
    expect(total).toBeCloseTo(1);
  });

  // ── k fuera del rango válido devuelve 0, no lanza excepción ───────────────
  // k > K: imposible obtener más éxitos que copias existentes → P = 0.
  // k > n: imposible obtener más éxitos que cartas robadas → P = 0.
  // No son configuraciones inválidas del mazo; son resultados imposibles.
  it('returns 0 when k > K', () => {
    expect(hypergeometricProbability(10, 3, 5, 4)).toBeCloseTo(0);
  });

  it('returns 0 when k > n', () => {
    expect(hypergeometricProbability(10, 5, 3, 4)).toBeCloseTo(0);
  });

  // ── Entradas inválidas (configuración de mazo imposible) ──────────────────
  it('throws when n > N (drawing more cards than the deck has)', () => {
    expect(() => hypergeometricProbability(5, 2, 6, 1)).toThrow(RangeError);
  });

  it('throws when K > N (more copies than deck size)', () => {
    expect(() => hypergeometricProbability(5, 6, 3, 1)).toThrow(RangeError);
  });

  it('throws when any parameter is negative', () => {
    expect(() => hypergeometricProbability(-1, 2, 3, 1)).toThrow(RangeError);
    expect(() => hypergeometricProbability(10, -1, 3, 1)).toThrow(RangeError);
    expect(() => hypergeometricProbability(10, 2, -1, 1)).toThrow(RangeError);
    expect(() => hypergeometricProbability(10, 2, 3, -1)).toThrow(RangeError);
  });

  it('throws when any parameter is non-integer', () => {
    expect(() => hypergeometricProbability(10.5, 2, 3, 1)).toThrow(RangeError);
  });
});
