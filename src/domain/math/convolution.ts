/**
 * @module convolution
 *
 * Discrete convolution of two probability distributions.
 *
 * Convolution answers: "if I add two independent random variables X and Y,
 * what is the distribution of X + Y?" This is the operation behind summing
 * dice: rolling 2D6 is the convolution of two fair D6 distributions.
 */

import { Distribution, ProbabilityEntry } from './distribution';

/**
 * Returns the distribution of the sum of two independent discrete random
 * variables by convolving their probability distributions.
 *
 * For each pair of outcomes (a, b) from distributions A and B, the sum
 * a + b occurs with probability P(A = a) · P(B = b):
 *
 *   P(Z = z) = Σ { P(A = a) · P(B = b) : a + b = z }
 *
 * When multiple pairs share the same sum, their probabilities are accumulated.
 * The result is sorted by value ascending so it can be used directly as a
 * `Distribution` in further calculations (e.g. CDF, expected value).
 *
 * Time complexity : O(|A| · |B|)
 * Space complexity: O(|A| + |B|) — at most |A| + |B| − 1 distinct sums.
 *
 * @param distA - A normalized discrete distribution.
 * @param distB - A normalized discrete distribution.
 * @returns A new normalized `Distribution` representing the sum A + B.
 *
 * @example
 * // Distribution of the sum of two fair six-sided dice
 * const twoD6 = convolve(fairD6, fairD6);
 * // twoD6 has 11 entries (values 2–12).
 * // P(sum = 7) ≈ 0.1667, P(sum = 2) ≈ 0.0278
 */
export function convolve(distA: Distribution, distB: Distribution): Distribution {
  // Accumulate P(Z = z) = Σ P(A=a) · P(B=b) for all pairs where a+b = z.
  const accumulated = new Map<number, number>();

  for (const entryA of distA) {
    for (const entryB of distB) {
      const sum = entryA.value + entryB.value;
      const probability = entryA.probability * entryB.probability;
      accumulated.set(sum, (accumulated.get(sum) ?? 0) + probability);
    }
  }

  const result: ProbabilityEntry[] = [];
  for (const [value, probability] of accumulated) {
    result.push({ value, probability });
  }

  return result.sort((a, b) => a.value - b.value);
}

/**
 * Convolves a distribution with itself `times` times, producing the
 * distribution of the sum of `times` independent copies of the same
 * random variable.
 *
 * This is the operation behind multi-dice rolls: rolling 3D6 asks for
 * the sum of three independent D6 distributions.
 *
 * Special case: times = 0 returns a degenerate distribution at 0,
 * the identity element of addition ("sum of nothing is zero").
 *
 * Time complexity : O(times × |dist|²)
 * Space complexity: O(times × |dist|)
 *
 * @param dist  - A normalized discrete distribution.
 * @param times - Number of times to convolve. Must be a non-negative integer.
 * @returns A `Distribution` representing the sum of `times` copies of `dist`.
 *
 * @throws {RangeError} If `times` is not a non-negative integer.
 *
 * @example
 * multiConvolve(fairD6, 3) // distribution of 3D6, values in [3, 18]
 */
export function multiConvolve(dist: Distribution, times: number): Distribution {
  if (!Number.isInteger(times) || times < 0) {
    throw new RangeError(
      `multiConvolve: times must be a non-negative integer, got ${times}`,
    );
  }
  if (times === 0) {
    return [{ value: 0, probability: 1 }];
  }
  let result: Distribution = dist;
  for (let i = 1; i < times; i++) {
    result = convolve(result, dist);
  }
  return result;
}
