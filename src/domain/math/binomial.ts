/**
 * @module binomial
 *
 * Binomial probability mass function (PMF).
 *
 * Models situations where an experiment with exactly two outcomes (success /
 * failure) is repeated n times independently, all with the same probability
 * of success p. The binomial distribution answers: "what is the probability
 * of getting exactly k successes in n trials?"
 *
 * Typical game scenarios:
 * - Rolling a die n times and counting how many rolls meet a target.
 * - Making n attack rolls and counting hits.
 * - Drawing with replacement and counting a specific result.
 */

import { binomialCoefficient } from './combinatorics';
import { Distribution, ProbabilityEntry } from './distribution';

/**
 * Computes the probability of exactly k successes in n independent Bernoulli
 * trials each with success probability p.
 *
 * Binomial PMF:
 *
 *   P(X = k) = C(n, k) · pᵏ · (1 − p)^(n−k)
 *
 * @param n - Total number of trials. Must be a non-negative integer.
 * @param k - Desired number of successes. Must satisfy 0 ≤ k ≤ n.
 * @param p - Probability of success on a single trial. Must be in [0, 1].
 * @returns The probability P(X = k), in [0, 1].
 *
 * @throws {RangeError} If n or k are not non-negative integers, k > n, or p
 *   is outside [0, 1].
 *
 * @example
 * // Probability of exactly 2 successes in 4 fair coin flips
 * binomialProbability(4, 2, 0.5) // → 0.375
 *
 * // Probability of hitting exactly 3 out of 5 attacks with 60% hit chance
 * binomialProbability(5, 3, 0.6) // → 0.3456
 */
export function binomialProbability(n: number, k: number, p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError(
      `binomialProbability: p must be in [0, 1], got ${p}`,
    );
  }

  // Delegates n/k validation to binomialCoefficient, which throws RangeError
  // for the same invalid-input cases (non-integer, negative, k > n).
  const coefficient = binomialCoefficient(n, k);

  // P(X = k) = C(n, k) · pᵏ · (1 − p)^(n−k)
  return coefficient * p ** k * (1 - p) ** (n - k);
}

/**
 * Generates the full probability distribution of a binomial random variable.
 *
 * Returns P(X = k) for every k in {0, 1, …, n}, producing a complete
 * picture of all possible success counts. Entries with probability 0
 * (which only occur when p = 0 or p = 1) are omitted.
 *
 * This is the distribution form of `binomialProbability`: instead of asking
 * "what is P(X = k)?" for a single k, it answers "what is the full
 * distribution of X?"
 *
 * @param n - Total number of trials. Must be a non-negative integer.
 * @param p - Probability of success on a single trial. Must be in [0, 1].
 * @returns A `Distribution` with entries k = 0…n sorted ascending.
 *
 * @throws {RangeError} If n is not a non-negative integer or p is outside [0, 1].
 *
 * @example
 * binomialDistribution(2, 0.5)
 * // → [{value:0, probability:0.25}, {value:1, probability:0.5}, {value:2, probability:0.25}]
 */
export function binomialDistribution(n: number, p: number): Distribution {
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError(
      `binomialDistribution: p must be in [0, 1], got ${p}`,
    );
  }
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(
      `binomialDistribution: n must be a non-negative integer, got ${n}`,
    );
  }

  const entries: ProbabilityEntry[] = [];
  for (let k = 0; k <= n; k++) {
    const probability = binomialProbability(n, k, p);
    // Skip zero-probability entries (only happen when p=0 or p=1).
    if (probability > 0) {
      entries.push({ value: k, probability });
    }
  }
  // Entries are already sorted ascending since k iterates 0..n.
  return entries;
}
