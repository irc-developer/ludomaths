/**
 * @module hypergeometric
 *
 * Hypergeometric probability mass function (PMF).
 *
 * Models drawing without replacement from a finite population. Unlike the
 * binomial distribution (which assumes independent trials with constant p),
 * the hypergeometric accounts for the fact that each draw changes what
 * remains in the deck.
 *
 * Typical game scenarios:
 * - Drawing an opening hand and asking how many copies of a card it contains.
 * - Checking the probability of a combo being available in the first n draws.
 */

import { binomialCoefficient } from './combinatorics';

/**
 * Computes the probability of drawing exactly k copies of a target card
 * when drawing n cards from a deck of N, where K copies exist.
 *
 * Hypergeometric PMF:
 *
 *   P(X = k) = C(K, k) · C(N − K, n − k) / C(N, n)
 *
 * @param N - Total deck size. Must be a non-negative integer.
 * @param K - Number of copies of the target card in the deck. Must satisfy 0 ≤ K ≤ N.
 * @param n - Number of cards drawn. Must satisfy 0 ≤ n ≤ N.
 * @param k - Desired number of copies in the drawn hand. Must satisfy 0 ≤ k ≤ min(K, n).
 * @returns The probability P(X = k), in [0, 1].
 *
 * @throws {RangeError} If any parameter is not a non-negative integer, or if
 *   the constraints K ≤ N, n ≤ N, and k ≤ min(K, n) are violated.
 *
 * @example
 * // Probability of 0 aces in a 5-card hand from a standard 52-card deck
 * hypergeometricProbability(52, 4, 5, 0) // → ~0.6588
 *
 * // Probability of at least 1 copy of a 4-of in an opening hand of 7
 * // = 1 - hypergeometricProbability(60, 4, 7, 0)
 */
export function hypergeometricProbability(
  N: number,
  K: number,
  n: number,
  k: number,
): number {
  for (const [label, value] of [['N', N], ['K', K], ['n', n], ['k', k]] as const) {
    if (!Number.isInteger(value) || value < 0) {
      throw new RangeError(
        `hypergeometricProbability: ${label} must be a non-negative integer, got ${value}`,
      );
    }
  }
  if (K > N) {
    throw new RangeError(
      `hypergeometricProbability: K must be ≤ N, got K=${K}, N=${N}`,
    );
  }
  if (n > N) {
    throw new RangeError(
      `hypergeometricProbability: n must be ≤ N, got n=${n}, N=${N}`,
    );
  }
  // k > K or k > n means the outcome is impossible but the question is valid.
  // C(K, k) = 0 when k > K, so the formula naturally yields 0.
  if (k > K || k > n) {
    return 0;
  }

  // P(X = k) = C(K, k) · C(N − K, n − k) / C(N, n)
  return (
    (binomialCoefficient(K, k) * binomialCoefficient(N - K, n - k)) /
    binomialCoefficient(N, n)
  );
}

/**
 * Cumulative distribution function (CDF) — P(X ≤ k).
 *
 * Sums the PMF over all outcomes from 0 to k. Accepts k > min(K, n)
 * gracefully: terms beyond the support contribute 0, so the result is 1.
 *
 *   P(X ≤ k) = Σ_{i=0}^{k} P(X = i)
 *
 * Parameters follow the same constraints as {@link hypergeometricProbability}.
 */
export function hypergeometricAtMost(
  N: number,
  K: number,
  n: number,
  k: number,
): number {
  // Delegate parameter validation to the PMF (called with i=0 on first iteration).
  // Cap the loop at min(K, n) — further terms are guaranteed 0.
  const limit = Math.min(k, K, n);
  let total = 0;
  for (let i = 0; i <= limit; i++) {
    total += hypergeometricProbability(N, K, n, i);
  }
  return total;
}

/**
 * Complementary CDF — P(X ≥ k).
 *
 *   P(X ≥ k) = 1 − P(X ≤ k − 1)
 *
 * Returns 1 when k = 0 (trivially true), and 0 when k > min(K, n)
 * (the event is impossible).
 *
 * Parameters follow the same constraints as {@link hypergeometricProbability}.
 */
export function hypergeometricAtLeast(
  N: number,
  K: number,
  n: number,
  k: number,
): number {
  if (k <= 0) return 1;
  return 1 - hypergeometricAtMost(N, K, n, k - 1);
}

/**
 * Conditional (Bayesian-updated) hypergeometric probability.
 *
 * After observing `seen` copies of the target in `drawn` total cards drawn,
 * the remaining deck has (N − drawn) cards with (K − seen) copies left.
 * The probability of drawing exactly `k` copies in `futureDraws` more cards
 * is a fresh hypergeometric calculation over that reduced population.
 *
 *   P(X = k | drawn, seen) = hypergeometricProbability(N − drawn, K − seen, futureDraws, k)
 *
 * @param N          - Original total deck size.
 * @param K          - Original number of target copies in the deck.
 * @param drawn      - Total cards already drawn. Must satisfy drawn ≤ N.
 * @param seen       - Target copies already seen. Must satisfy seen ≤ K and seen ≤ drawn.
 * @param futureDraws - Cards to draw next. Must satisfy futureDraws ≤ N − drawn.
 * @param k          - Desired copies in the future draw.
 *
 * @throws {RangeError} If drawn > N, seen > K, seen > drawn, or futureDraws > N − drawn.
 */
export function hypergeometricConditional(
  N: number,
  K: number,
  drawn: number,
  seen: number,
  futureDraws: number,
  k: number,
): number {
  if (!Number.isInteger(drawn) || drawn < 0 || drawn > N) {
    throw new RangeError(
      `hypergeometricConditional: drawn must be an integer in [0, N], got drawn=${drawn}, N=${N}`,
    );
  }
  if (!Number.isInteger(seen) || seen < 0 || seen > K) {
    throw new RangeError(
      `hypergeometricConditional: seen must be an integer in [0, K], got seen=${seen}, K=${K}`,
    );
  }
  if (seen > drawn) {
    throw new RangeError(
      `hypergeometricConditional: seen must be ≤ drawn, got seen=${seen}, drawn=${drawn}`,
    );
  }
  // P(X = k | drawn, seen) = hypergeometricProbability(N − drawn, K − seen, futureDraws, k)
  return hypergeometricProbability(N - drawn, K - seen, futureDraws, k);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared validation helper (internal)
// ─────────────────────────────────────────────────────────────────────────────
function validateNKn(N: number, K: number, n: number, prefix: string): void {
  for (const [label, value] of [['N', N], ['K', K], ['n', n]] as [string, number][]) {
    if (!Number.isInteger(value) || value < 0) {
      throw new RangeError(`${prefix}: ${label} must be a non-negative integer, got ${value}`);
    }
  }
  if (K > N) throw new RangeError(`${prefix}: K must be ≤ N, got K=${K}, N=${N}`);
  if (n > N) throw new RangeError(`${prefix}: n must be ≤ N, got n=${n}, N=${N}`);
}

/**
 * Expected value (mean) of the hypergeometric distribution.
 *
 *   E[X] = n · K / N
 */
export function hypergeometricMean(N: number, K: number, n: number): number {
  validateNKn(N, K, n, 'hypergeometricMean');
  // E[X] = n * K / N
  return (n * K) / N;
}

/**
 * Variance of the hypergeometric distribution.
 *
 *   Var[X] = n · (K/N) · ((N−K)/N) · ((N−n)/(N−1))
 *
 * Returns 0 when N = 1 (degenerate deck: no variability possible).
 */
export function hypergeometricVariance(N: number, K: number, n: number): number {
  validateNKn(N, K, n, 'hypergeometricVariance');
  if (N <= 1) return 0;
  // Var[X] = n * (K/N) * ((N-K)/N) * ((N-n)/(N-1))
  return n * (K / N) * ((N - K) / N) * ((N - n) / (N - 1));
}

/**
 * Joint PMF of two card types drawn without replacement (bivariate hypergeometric).
 *
 * Models drawing a hand of n cards from a deck where Ka copies of card A and
 * Kb copies of card B exist (with Ka + Kb ≤ N).
 *
 *   P(X_A = i, X_B = j) = C(Ka, i) · C(Kb, j) · C(N − Ka − Kb, n − i − j) / C(N, n)
 *
 * @param N  - Total deck size.
 * @param Ka - Copies of card A. Must satisfy Ka + Kb ≤ N.
 * @param Kb - Copies of card B. Must satisfy Ka + Kb ≤ N.
 * @param n  - Cards drawn.
 * @param i  - Desired copies of A.
 * @param j  - Desired copies of B.
 */
export function multivariateHypergeometricProbability(
  N: number,
  Ka: number,
  Kb: number,
  n: number,
  i: number,
  j: number,
): number {
  for (const [label, value] of [['N', N], ['Ka', Ka], ['Kb', Kb], ['n', n], ['i', i], ['j', j]] as [string, number][]) {
    if (!Number.isInteger(value) || value < 0) {
      throw new RangeError(
        `multivariateHypergeometricProbability: ${label} must be a non-negative integer, got ${value}`,
      );
    }
  }
  if (Ka + Kb > N) {
    throw new RangeError(
      `multivariateHypergeometricProbability: Ka + Kb must be ≤ N, got ${Ka + Kb} > ${N}`,
    );
  }
  if (n > N) {
    throw new RangeError(
      `multivariateHypergeometricProbability: n must be ≤ N, got n=${n}, N=${N}`,
    );
  }
  // Impossible outcomes: more of a type than available, or more total than drawn.
  if (i > Ka || j > Kb || i + j > n) return 0;

  // P(X_A=i, X_B=j) = C(Ka,i) * C(Kb,j) * C(N-Ka-Kb, n-i-j) / C(N,n)
  return (
    (binomialCoefficient(Ka, i) *
      binomialCoefficient(Kb, j) *
      binomialCoefficient(N - Ka - Kb, n - i - j)) /
    binomialCoefficient(N, n)
  );
}

/**
 * Combo probability: P(X_A ≥ a AND X_B ≥ b).
 *
 * Sums the bivariate PMF over all joint outcomes where X_A ≥ a and X_B ≥ b.
 *
 * Typical use case: "What is the probability that my opening hand of n cards
 * contains at least a copies of card A AND at least b copies of card B?"
 *
 * @param N  - Total deck size.
 * @param Ka - Copies of card A.
 * @param Kb - Copies of card B.
 * @param n  - Cards drawn.
 * @param a  - Minimum desired copies of A.
 * @param b  - Minimum desired copies of B.
 */
export function comboAtLeast(
  N: number,
  Ka: number,
  Kb: number,
  n: number,
  a: number,
  b: number,
): number {
  // P(X_A >= a, X_B >= b) = Σ_{i=a..Ka} Σ_{j=b..Kb} P(X_A=i, X_B=j)
  let total = 0;
  for (let i = a; i <= Math.min(Ka, n); i++) {
    for (let j = b; j <= Math.min(Kb, n - i); j++) {
      total += multivariateHypergeometricProbability(N, Ka, Kb, n, i, j);
    }
  }
  return total;
}

/**
 * Negative hypergeometric PMF — probability that the first copy of the target
 * card appears on exactly the t-th draw.
 *
 * Drawing without replacement: the first t−1 cards are all non-target, and the
 * t-th card is a target copy.
 *
 *   P(T = t) = (K / N) · C(N−K, t−1) / C(N−1, t−1)
 *
 * Valid support: t ∈ {1, …, N−K+1}. Returns 0 outside this range.
 *
 * @param N - Total deck size. Must be a positive integer.
 * @param K - Number of target copies. Must satisfy 1 ≤ K ≤ N.
 * @param t - Draw index (1-based) at which the first success occurs.
 *
 * @throws {RangeError} If N < 1, K < 1, or K > N.
 */
export function negativeHypergeometricPMF(N: number, K: number, t: number): number {
  if (!Number.isInteger(N) || N < 1) {
    throw new RangeError(`negativeHypergeometricPMF: N must be a positive integer, got ${N}`);
  }
  if (!Number.isInteger(K) || K < 1) {
    throw new RangeError(`negativeHypergeometricPMF: K must be ≥ 1, got ${K}`);
  }
  if (K > N) {
    throw new RangeError(`negativeHypergeometricPMF: K must be ≤ N, got K=${K}, N=${N}`);
  }
  // t outside valid support [1, N-K+1]: the event is impossible, not invalid.
  if (!Number.isInteger(t) || t < 1 || t > N - K + 1) return 0;

  // P(T = t) = (K / N) * C(N-K, t-1) / C(N-1, t-1)
  return (K / N) * (binomialCoefficient(N - K, t - 1) / binomialCoefficient(N - 1, t - 1));
}
