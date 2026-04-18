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
