import {
  mulliganAtLeast,
  pOnCurveByTurn,
  expectedInkByTurn,
  pOnCurveByTurnWithBonus,
  expectedInkByTurnWithBonus,
} from './lorcana';

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

// ─────────────────────────────────────────────────────────────────────────────
// pOnCurveByTurn — P(inkwell ≥ T al final del turno T)
//
// Suposición de juego óptimo: el jugador inkea siempre que puede.
// Por el turno T ha visto handSize+T cartas en total.
// Ink en turno T = min(T, X) donde X ~ Hyper(N, K, handSize+T).
// P(on curve) = P(X ≥ T) = P(haber visto al menos T cartas inkeables).
// ─────────────────────────────────────────────────────────────────────────────
describe('pOnCurveByTurn', () => {
  // T=0: ningún ink necesario → trivialmente cierto.
  it('returns 1 for T=0', () => {
    expect(pOnCurveByTurn(60, 40, 0, 7)).toBeCloseTo(1);
  });

  // Sin cartas inkeables (K=0), nunca se puede inkear → P=0 para T≥1.
  it('returns 0 for T=1 when K=0', () => {
    expect(pOnCurveByTurn(60, 0, 1, 7)).toBeCloseTo(0);
  });

  // Si todas las cartas son inkeables (K=N), siempre on curve.
  it('returns 1 when K=N', () => {
    expect(pOnCurveByTurn(10, 10, 3, 2)).toBeCloseTo(1);
  });

  // Verificación a mano: N=4, K=2, handSize=1, T=1.
  // Cartas vistas = 2. X ~ Hyper(4,2,2).
  // P(X≥1) = 1 − P(X=0) = 1 − C(2,0)*C(2,2)/C(4,2) = 1 − 1/6 = 5/6.
  it('returns 5/6 for N=4, K=2, handSize=1, T=1', () => {
    expect(pOnCurveByTurn(4, 2, 1, 1)).toBeCloseTo(5 / 6, 4);
  });

  // N=4, K=2, handSize=1, T=2.
  // Cartas vistas = 3. X ~ Hyper(4,2,3).
  // P(X=2) = C(2,2)*C(2,1)/C(4,3) = 1*2/4 = 0.5.
  it('returns 0.5 for N=4, K=2, handSize=1, T=2', () => {
    expect(pOnCurveByTurn(4, 2, 2, 1)).toBeCloseTo(0.5, 4);
  });

  // T mayor que las copias disponibles: imposible → P=0.
  it('returns 0 when T > K', () => {
    expect(pOnCurveByTurn(60, 2, 5, 7)).toBeCloseTo(0);
  });

  // Con 40 inkeables en 60 y mano de 7, turno 1 tiene altísima probabilidad.
  it('returns near 1 for T=1 with 40 inkable cards in a 60-card deck', () => {
    expect(pOnCurveByTurn(60, 40, 1, 7)).toBeGreaterThan(0.999);
  });

  it('throws when handSize + T > N', () => {
    expect(() => pOnCurveByTurn(5, 2, 4, 3)).toThrow(RangeError);
  });

  it('throws when K > N', () => {
    expect(() => pOnCurveByTurn(5, 6, 1, 2)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// expectedInkByTurn — E[min(T, X)] donde X ~ Hyper(N, K, handSize+T)
//
// Ink esperado en el turno T bajo juego óptimo.
// Por la fórmula de cola para enteros acotados:
//   E[min(T, X)] = Σ_{k=1}^{T} P(X ≥ k)
// ─────────────────────────────────────────────────────────────────────────────
describe('expectedInkByTurn', () => {
  // T=0: no hay turnos → inkwell vacío.
  it('returns 0 for T=0', () => {
    expect(expectedInkByTurn(60, 40, 0, 7)).toBe(0);
  });

  // K=0: nunca hay ink esperado.
  it('returns 0 when K=0', () => {
    expect(expectedInkByTurn(60, 0, 3, 7)).toBeCloseTo(0);
  });

  // K=N: todas las cartas son inkeables → ink esperado = T exactamente.
  it('returns T when K=N', () => {
    expect(expectedInkByTurn(10, 10, 3, 2)).toBeCloseTo(3);
  });

  // Verificación a mano: N=4, K=2, handSize=1, T=1.
  // E[min(1,X)] = Σ_{k=1}^{1} P(X≥k) = P(X≥1) = 5/6.
  it('returns 5/6 for N=4, K=2, handSize=1, T=1', () => {
    expect(expectedInkByTurn(4, 2, 1, 1)).toBeCloseTo(5 / 6, 4);
  });

  // Verificación a mano: N=4, K=2, handSize=1, T=2.
  // X ~ Hyper(4,2,3). P(X≥1)=1, P(X≥2)=0.5.
  // E[min(2,X)] = 1 + 0.5 = 1.5.
  it('returns 1.5 for N=4, K=2, handSize=1, T=2', () => {
    expect(expectedInkByTurn(4, 2, 2, 1)).toBeCloseTo(1.5, 4);
  });

  // El ink esperado nunca supera T.
  it('is always ≤ T', () => {
    expect(expectedInkByTurn(60, 20, 4, 7)).toBeLessThanOrEqual(4);
  });

  // El ink esperado nunca es negativo.
  it('is always ≥ 0', () => {
    expect(expectedInkByTurn(60, 20, 4, 7)).toBeGreaterThanOrEqual(0);
  });

  it('throws when handSize + T > N', () => {
    expect(() => expectedInkByTurn(5, 2, 4, 3)).toThrow(RangeError);
  });

  it('throws when K > N', () => {
    expect(() => expectedInkByTurn(5, 6, 1, 2)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// pOnCurveByTurnWithBonus — P(inkwell ≥ T) con cartas de tinta extra
//
// K = cartas inkeables (tinta normal). E = cartas que otorgan +1 tinta
// al jugarse (poblaciones disjuntas, K+E ≤ N).
// Tinta total en turno T = min(T, X_ink) + X_extra.
// Usamos la hipergeométrica bivariante para la distribución conjunta.
// ─────────────────────────────────────────────────────────────────────────────
describe('pOnCurveByTurnWithBonus', () => {
  // E=0: debe coincidir exactamente con pOnCurveByTurn.
  it('degrades to pOnCurveByTurn when E=0', () => {
    expect(pOnCurveByTurnWithBonus(60, 40, 0, 2, 7))
      .toBeCloseTo(pOnCurveByTurn(60, 40, 2, 7), 6);
  });

  // T=0: trivialmente cierto.
  it('returns 1 for T=0', () => {
    expect(pOnCurveByTurnWithBonus(60, 20, 10, 0, 7)).toBeCloseTo(1);
  });

  // K=0, sólo bonus: on curve si X_extra ≥ T.
  // N=10, E=2, T=1, handSize=7 → n=8, X_extra ~ Hyper(10,2,8).
  // P(X_extra ≥ 1) = 1 - C(2,0)*C(8,8)/C(10,8) = 1 - 1/45 ≈ 0.9778.
  it('returns ~0.9778 with K=0, E=2, T=1, handSize=7 in a 10-card deck', () => {
    expect(pOnCurveByTurnWithBonus(10, 0, 2, 1, 7)).toBeCloseTo(1 - 1 / 45, 4);
  });

  // Caso verificable a mano: N=5, K=1, E=1, T=2, handSize=1.
  // n=3. Distribución conjunta bivariante (K+E=2, neutras=3).
  // Casos que satisfacen min(2,i)+j ≥ 2 (ver lógica en comentario de la función):
  // (1,1) → 1+1=2: P = C(1,1)*C(1,1)*C(3,1)/C(5,3) = 3/10.
  // Total = 3/10 = 0.3.
  it('returns 0.3 for N=5, K=1, E=1, T=2, handSize=1', () => {
    expect(pOnCurveByTurnWithBonus(5, 1, 1, 2, 1)).toBeCloseTo(0.3, 4);
  });

  // Con suficientes bonus (E ≥ T), siempre on curve si se han visto todas.
  // Si E ≥ T y n ≥ E, P(X_extra ≥ T) puede ser alta. Verificamos que la
  // probabilidad con bonus es ≥ que sin bonus.
  it('is always ≥ pOnCurveByTurn for the same parameters', () => {
    const withBonus = pOnCurveByTurnWithBonus(60, 20, 10, 3, 7);
    const withoutBonus = pOnCurveByTurn(60, 20, 3, 7);
    expect(withBonus).toBeGreaterThanOrEqual(withoutBonus - 0.001);
  });

  it('throws when K + E > N', () => {
    expect(() => pOnCurveByTurnWithBonus(5, 3, 3, 1, 1)).toThrow(RangeError);
  });

  it('throws when handSize + T > N', () => {
    expect(() => pOnCurveByTurnWithBonus(5, 2, 1, 4, 2)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// expectedInkByTurnWithBonus — E[min(T,X_ink) + X_extra]
//
// Por la linealidad de la esperanza (exacta, no una aproximación):
//   E[min(T,X_ink) + X_extra] = E[min(T,X_ink)] + E[X_extra]
//   = expectedInkByTurn(N,K,T,handSize) + hypergeometricMean(N,E,handSize+T)
// ─────────────────────────────────────────────────────────────────────────────
describe('expectedInkByTurnWithBonus', () => {
  // E=0: debe coincidir con expectedInkByTurn.
  it('degrades to expectedInkByTurn when E=0', () => {
    expect(expectedInkByTurnWithBonus(60, 40, 0, 3, 7))
      .toBeCloseTo(expectedInkByTurn(60, 40, 3, 7), 6);
  });

  // T=0: inkwell vacío.
  it('returns 0 for T=0', () => {
    expect(expectedInkByTurnWithBonus(60, 20, 10, 0, 7)).toBe(0);
  });

  // Verificación a mano: N=5, K=1, E=1, T=2, handSize=1.
  // E[min(2,X_ink)] = 6/10 (ver cálculo en comentario implementación).
  // E[X_extra] = hypergeometricMean(5,1,3) = 3/5 = 0.6.
  // Total = 0.6 + 0.6 = 1.2.
  it('returns 1.2 for N=5, K=1, E=1, T=2, handSize=1', () => {
    expect(expectedInkByTurnWithBonus(5, 1, 1, 2, 1)).toBeCloseTo(1.2, 4);
  });

  // El ink con bonus es siempre ≥ ink sin bonus.
  it('is always ≥ expectedInkByTurn for the same parameters', () => {
    const withBonus = expectedInkByTurnWithBonus(60, 20, 10, 3, 7);
    const withoutBonus = expectedInkByTurn(60, 20, 3, 7);
    expect(withBonus).toBeGreaterThanOrEqual(withoutBonus - 0.001);
  });

  // El bonus añade exactamente E[X_extra] = hypergeometricMean(N,E,handSize+T).
  it('bonus contribution equals hypergeometricMean(N, E, handSize+T)', () => {
    const N = 60, K = 20, E = 10, T = 3, handSize = 7;
    const diff = expectedInkByTurnWithBonus(N, K, E, T, handSize)
      - expectedInkByTurn(N, K, T, handSize);
    // E[X_extra] = (handSize+T)*E/N = 10*10/60
    const expectedBonus = (handSize + T) * E / N;
    expect(diff).toBeCloseTo(expectedBonus, 6);
  });

  it('throws when K + E > N', () => {
    expect(() => expectedInkByTurnWithBonus(5, 3, 3, 1, 1)).toThrow(RangeError);
  });

  it('throws when handSize + T > N', () => {
    expect(() => expectedInkByTurnWithBonus(5, 2, 1, 4, 2)).toThrow(RangeError);
  });
});
