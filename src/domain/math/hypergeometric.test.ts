import {
  hypergeometricProbability,
  hypergeometricAtMost,
  hypergeometricAtLeast,
  hypergeometricConditional,
  hypergeometricMean,
  hypergeometricVariance,
  multivariateHypergeometricProbability,
  comboAtLeast,
  negativeHypergeometricPMF,
} from './hypergeometric';

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

// ─────────────────────────────────────────────────────────────────────────────
// hypergeometricAtMost — CDF: P(X ≤ k)
// ─────────────────────────────────────────────────────────────────────────────
describe('hypergeometricAtMost', () => {
  // P(X ≤ 0) debe coincidir con PMF(k=0).
  it('equals the PMF for k=0', () => {
    expect(hypergeometricAtMost(52, 4, 5, 0)).toBeCloseTo(0.6588, 3);
  });

  // P(X ≤ max_k) = 1: cubrir todos los resultados posibles suma 1.
  // Para N=52, K=4, n=5 → max_k = min(4,5) = 4.
  it('returns 1 when k ≥ min(K, n)', () => {
    expect(hypergeometricAtMost(52, 4, 5, 4)).toBeCloseTo(1);
  });

  // k muy grande: también 1 (comportamiento seguro para k > min(K,n)).
  it('returns 1 when k exceeds min(K, n)', () => {
    expect(hypergeometricAtMost(10, 3, 4, 100)).toBeCloseTo(1);
  });

  // Verificación numérica pequeña: N=4, K=2, n=2.
  // P(X=0)=1/6, P(X=1)=4/6, P(X=2)=1/6 → atMost(1) = 5/6 ≈ 0.8333.
  it('returns 5/6 for atMost(1) with N=4, K=2, n=2', () => {
    expect(hypergeometricAtMost(4, 2, 2, 1)).toBeCloseTo(5 / 6);
  });

  it('throws when n > N', () => {
    expect(() => hypergeometricAtMost(5, 2, 6, 1)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hypergeometricAtLeast — P(X ≥ k) = 1 − P(X ≤ k−1)
// ─────────────────────────────────────────────────────────────────────────────
describe('hypergeometricAtLeast', () => {
  // P(X ≥ 0) = 1 siempre: alguna cantidad de éxitos (incluyendo 0) es segura.
  it('returns 1 for k=0', () => {
    expect(hypergeometricAtLeast(60, 4, 7, 0)).toBeCloseTo(1);
  });

  // Caso Lorcana documentado: 4 copias en 60, mano de 7.
  // P(al menos 1) ≈ 0.400 → 1 − P(X=0) ≈ 1 − 0.600.
  it('returns ~0.40 for at-least-1 in a 60-card Lorcana opening hand', () => {
    expect(hypergeometricAtLeast(60, 4, 7, 1)).toBeCloseTo(0.4, 1);
  });

  // P(X ≥ k) + P(X ≤ k−1) = 1 para cualquier k válido.
  it('is the complement of atMost(k-1)', () => {
    const [N, K, n, k] = [52, 4, 5, 2];
    expect(hypergeometricAtLeast(N, K, n, k) + hypergeometricAtMost(N, K, n, k - 1))
      .toBeCloseTo(1);
  });

  // Si k > min(K,n): imposible obtener ese número de éxitos → P = 0.
  it('returns 0 when k > min(K, n)', () => {
    expect(hypergeometricAtLeast(10, 3, 4, 5)).toBeCloseTo(0);
  });

  it('throws when K > N', () => {
    expect(() => hypergeometricAtLeast(5, 6, 3, 1)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hypergeometricConditional — P(X=k | drawn, seen)
//
// Update bayesiano: dado que ya robamos `drawn` cartas y hemos visto `seen`
// copias, el mazo restante tiene N−drawn cartas y K−seen copias.
// La probabilidad futura es idéntica a una nueva tirada hipergeométrica sobre
// ese mazo reducido.
// ─────────────────────────────────────────────────────────────────────────────
describe('hypergeometricConditional', () => {
  // Sin información previa (drawn=0, seen=0) debe coincidir con la PMF normal.
  it('equals the plain PMF when no cards have been drawn', () => {
    expect(hypergeometricConditional(60, 4, 0, 0, 7, 0))
      .toBeCloseTo(hypergeometricProbability(60, 4, 7, 0));
  });

  // Robados 7 cartas sin ver ninguna copia (drawn=7, seen=0):
  // El mazo tiene 53 cartas con 4 copias.
  // Probabilidad de ver exactamente 1 en el siguiente robo:
  // P = C(4,1)*C(49,0)/C(53,1) = 4/53 ≈ 0.0755.
  it('returns 4/53 after drawing 7 cards with 0 copies seen (next draw)', () => {
    expect(hypergeometricConditional(60, 4, 7, 0, 1, 1))
      .toBeCloseTo(4 / 53, 4);
  });

  // Si ya se vieron todas las copias (seen=K), la probabilidad de ver más es 0.
  it('returns 0 when all copies have been seen', () => {
    expect(hypergeometricConditional(60, 4, 10, 4, 5, 1)).toBeCloseTo(0);
  });

  // Caso verificable a mano:
  // Mazo inicial N=10, K=3. Robadas 2 cartas, vistas 1 copia.
  // Mazo restante: 8 cartas, 2 copias. Robamos 3 más, queremos k=1.
  // P = C(2,1)*C(6,2)/C(8,3) = 2*15/56 = 30/56 ≈ 0.5357.
  it('returns 30/56 for a hand-verifiable case', () => {
    expect(hypergeometricConditional(10, 3, 2, 1, 3, 1))
      .toBeCloseTo(30 / 56, 4);
  });

  // ── Entradas inválidas ────────────────────────────────────────────────────
  it('throws when drawn > N', () => {
    expect(() => hypergeometricConditional(10, 3, 11, 0, 1, 1)).toThrow(RangeError);
  });

  it('throws when seen > K', () => {
    expect(() => hypergeometricConditional(10, 3, 5, 4, 1, 1)).toThrow(RangeError);
  });

  it('throws when seen > drawn', () => {
    expect(() => hypergeometricConditional(10, 3, 2, 3, 1, 1)).toThrow(RangeError);
  });

  it('throws when futureDraws > remaining deck (N − drawn)', () => {
    expect(() => hypergeometricConditional(10, 3, 5, 1, 6, 1)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hypergeometricMean / hypergeometricVariance
//
// Fórmulas cerradas para la distribución hipergeométrica.
// E[X] = n * K / N
// Var[X] = n * (K/N) * ((N-K)/N) * ((N-n)/(N-1))
// ─────────────────────────────────────────────────────────────────────────────
describe('hypergeometricMean', () => {
  // Caso base: si no hay copias, la media es 0.
  it('returns 0 when K=0', () => {
    expect(hypergeometricMean(60, 0, 7)).toBe(0);
  });

  // Si robamos todo el mazo (n=N), la media es exactamente K.
  it('returns K when n equals N', () => {
    expect(hypergeometricMean(10, 3, 10)).toBeCloseTo(3);
  });

  // Lorcana: 4 copias en 60, mano de 7.
  // E[X] = 7 * 4/60 = 28/60 ≈ 0.4667.
  it('returns 28/60 for a Lorcana opening hand with 4 copies', () => {
    expect(hypergeometricMean(60, 4, 7)).toBeCloseTo(28 / 60, 4);
  });

  // Verificación: E[X] = n*K/N debe ser proporcional a n.
  it('scales linearly with n', () => {
    expect(hypergeometricMean(60, 4, 14)).toBeCloseTo(2 * hypergeometricMean(60, 4, 7), 4);
  });

  it('throws when K > N', () => {
    expect(() => hypergeometricMean(5, 6, 3)).toThrow(RangeError);
  });

  it('throws when n > N', () => {
    expect(() => hypergeometricMean(5, 2, 6)).toThrow(RangeError);
  });

  it('throws when any parameter is non-integer or negative', () => {
    expect(() => hypergeometricMean(-1, 2, 3)).toThrow(RangeError);
    expect(() => hypergeometricMean(10, -1, 3)).toThrow(RangeError);
    expect(() => hypergeometricMean(10, 2, -1)).toThrow(RangeError);
  });
});

describe('hypergeometricVariance', () => {
  // Con un único robo (n=1): Var = p*(1-p) donde p = K/N.
  // Var = 1*(K/N)*((N-K)/N)*((N-1)/(N-1)) = K*(N-K)/N^2.
  it('equals p*(1-p) when n=1', () => {
    const N = 60, K = 4;
    const p = K / N;
    expect(hypergeometricVariance(N, K, 1)).toBeCloseTo(p * (1 - p), 6);
  });

  // Caso pequeño verificable: N=4, K=2, n=2.
  // Var = 2*(2/4)*(2/4)*(2/3) = 2*0.25*0.25*(2/3) ≈ 1/3.
  it('returns 1/3 for N=4, K=2, n=2', () => {
    expect(hypergeometricVariance(4, 2, 2)).toBeCloseTo(1 / 3, 4);
  });

  // Si K=0 o K=N, no hay incertidumbre → varianza = 0.
  it('returns 0 when K=0 (no target cards)', () => {
    expect(hypergeometricVariance(10, 0, 5)).toBe(0);
  });

  it('returns 0 when K=N (all cards are target)', () => {
    expect(hypergeometricVariance(10, 10, 5)).toBeCloseTo(0);
  });

  // Caso degenerado: mazo de 1 carta (N=1) → sin variabilidad posible.
  it('returns 0 when N=1 (degenerate single-card deck)', () => {
    expect(hypergeometricVariance(1, 1, 1)).toBe(0);
  });

  it('throws when n > N', () => {
    expect(() => hypergeometricVariance(5, 2, 6)).toThrow(RangeError);
  });

  it('throws when any parameter is non-integer or negative', () => {
    expect(() => hypergeometricVariance(-1, 2, 3)).toThrow(RangeError);
    expect(() => hypergeometricVariance(10, -1, 3)).toThrow(RangeError);
    expect(() => hypergeometricVariance(10, 2, -1)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// multivariateHypergeometricProbability — PMF conjunta de dos tipos de carta
//
// P(X_A = i, X_B = j) = C(Ka,i) * C(Kb,j) * C(N-Ka-Kb, n-i-j) / C(N,n)
// ─────────────────────────────────────────────────────────────────────────────
describe('multivariateHypergeometricProbability', () => {
  // Si no hay copias de ninguna, P(i=0, j=0) = 1.
  it('returns 1 when Ka=0 and Kb=0 for i=0, j=0', () => {
    expect(multivariateHypergeometricProbability(10, 0, 0, 5, 0, 0)).toBeCloseTo(1);
  });

  // Caso verificable a mano: N=5, Ka=2, Kb=2, n=3, i=1, j=1.
  // C(2,1)*C(2,1)*C(1,1)/C(5,3) = 2*2*1/10 = 4/10 = 0.4.
  it('returns 0.4 for N=5, Ka=2, Kb=2, n=3, i=1, j=1', () => {
    expect(multivariateHypergeometricProbability(5, 2, 2, 3, 1, 1))
      .toBeCloseTo(0.4, 4);
  });

  // Degradación: si Kb=0 y j=0, debe coincidir con la PMF univariante.
  it('degrades to univariate PMF when Kb=0 and j=0', () => {
    expect(multivariateHypergeometricProbability(52, 4, 0, 5, 1, 0))
      .toBeCloseTo(hypergeometricProbability(52, 4, 5, 1), 6);
  });

  // i+j > n: imposible → P = 0.
  it('returns 0 when i+j > n', () => {
    expect(multivariateHypergeometricProbability(10, 3, 3, 4, 3, 3)).toBeCloseTo(0);
  });

  // i > Ka: imposible obtener más de A que copias existentes → P = 0.
  it('returns 0 when i > Ka', () => {
    expect(multivariateHypergeometricProbability(10, 2, 3, 5, 3, 1)).toBeCloseTo(0);
  });

  // j > Kb: imposible obtener más de B que copias existentes → P = 0.
  it('returns 0 when j > Kb', () => {
    expect(multivariateHypergeometricProbability(10, 3, 2, 5, 1, 3)).toBeCloseTo(0);
  });

  // La suma de todas las combinaciones válidas es 1.
  it('all valid joint outcomes sum to 1', () => {
    const N = 10, Ka = 3, Kb = 2, n = 4;
    let total = 0;
    for (let i = 0; i <= Math.min(Ka, n); i++) {
      for (let j = 0; j <= Math.min(Kb, n - i); j++) {
        total += multivariateHypergeometricProbability(N, Ka, Kb, n, i, j);
      }
    }
    expect(total).toBeCloseTo(1);
  });

  it('throws when Ka + Kb > N', () => {
    expect(() => multivariateHypergeometricProbability(5, 3, 3, 3, 1, 1)).toThrow(RangeError);
  });

  it('throws when n > N', () => {
    expect(() => multivariateHypergeometricProbability(5, 2, 2, 6, 1, 1)).toThrow(RangeError);
  });

  it('throws when any parameter is non-integer or negative', () => {
    expect(() => multivariateHypergeometricProbability(-1, 2, 2, 3, 1, 0)).toThrow(RangeError);
    expect(() => multivariateHypergeometricProbability(10, -1, 2, 3, 1, 0)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// comboAtLeast — P(X_A ≥ a AND X_B ≥ b)
// ─────────────────────────────────────────────────────────────────────────────
describe('comboAtLeast', () => {
  // P(A≥0 AND B≥0) = 1: trivialmente cierto.
  it('returns 1 when a=0 and b=0', () => {
    expect(comboAtLeast(60, 4, 4, 7, 0, 0)).toBeCloseTo(1);
  });

  // Degradación: si b=0, debe coincidir con hypergeometricAtLeast para A.
  it('degrades to univariate atLeast when b=0', () => {
    expect(comboAtLeast(60, 4, 0, 7, 1, 0))
      .toBeCloseTo(hypergeometricAtLeast(60, 4, 7, 1), 6);
  });

  // Caso Lorcana: 4 copias de A y 4 copias de B en mazo de 60, mano de 7.
  // P(tener al menos 1 de A Y al menos 1 de B) debe ser menor que
  // P(al menos 1 de A) porque el combo es un requisito más estricto.
  it('is less than or equal to each individual atLeast probability', () => {
    const combo = comboAtLeast(60, 4, 4, 7, 1, 1);
    const onlyA = hypergeometricAtLeast(60, 4, 7, 1);
    const onlyB = hypergeometricAtLeast(60, 4, 7, 1);
    expect(combo).toBeLessThanOrEqual(onlyA);
    expect(combo).toBeLessThanOrEqual(onlyB);
  });

  // Si a+b > n, el combo es imposible.
  it('returns 0 when a+b > n', () => {
    expect(comboAtLeast(60, 4, 4, 7, 4, 4)).toBeCloseTo(0);
  });

  it('throws when Ka + Kb > N', () => {
    expect(() => comboAtLeast(5, 3, 3, 3, 1, 1)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// negativeHypergeometricPMF — P(T = t): primer éxito en el robo t
//
// P(T = t) = (K/N) * C(N-K, t-1) / C(N-1, t-1)
// Válido para t = 1, …, N-K+1.
// ─────────────────────────────────────────────────────────────────────────────
describe('negativeHypergeometricPMF', () => {
  // Caso extremo: el mazo entero son la carta buscada (K=N).
  // El primer éxito es siempre en t=1 → P(T=1) = 1.
  it('returns 1 for t=1 when the whole deck is the target', () => {
    expect(negativeHypergeometricPMF(5, 5, 1)).toBeCloseTo(1);
  });

  // Caso verificable a mano: N=2, K=1.
  // P(T=1) = 1/2, P(T=2) = 1/2. Ambos deben sumar 1.
  it('returns 1/2 for t=1 and t=2 with N=2, K=1', () => {
    expect(negativeHypergeometricPMF(2, 1, 1)).toBeCloseTo(0.5);
    expect(negativeHypergeometricPMF(2, 1, 2)).toBeCloseTo(0.5);
  });

  // La suma de todos los t válidos (1 … N-K+1) debe ser 1.
  it('all valid t values sum to 1', () => {
    const N = 10, K = 3;
    let total = 0;
    for (let t = 1; t <= N - K + 1; t++) {
      total += negativeHypergeometricPMF(N, K, t);
    }
    expect(total).toBeCloseTo(1);
  });

  // Caso Lorcana: 4 copias en 60. P(T=1) = 4/60 ≈ 0.0667.
  it('returns 4/60 for t=1 in a Lorcana deck with 4 copies', () => {
    expect(negativeHypergeometricPMF(60, 4, 1)).toBeCloseTo(4 / 60, 4);
  });

  // t fuera del soporte [1, N-K+1] → P = 0 (sin excepción).
  it('returns 0 for t=0', () => {
    expect(negativeHypergeometricPMF(10, 3, 0)).toBeCloseTo(0);
  });

  it('returns 0 for t > N-K+1', () => {
    // N=10, K=3 → soporte máximo t=8. t=9 debe ser 0.
    expect(negativeHypergeometricPMF(10, 3, 9)).toBeCloseTo(0);
  });

  it('throws when K=0 (no target cards exist)', () => {
    expect(() => negativeHypergeometricPMF(10, 0, 1)).toThrow(RangeError);
  });

  it('throws when K > N', () => {
    expect(() => negativeHypergeometricPMF(5, 6, 1)).toThrow(RangeError);
  });

  it('throws when N is not a positive integer', () => {
    expect(() => negativeHypergeometricPMF(0, 0, 1)).toThrow(RangeError);
  });
});
