/**
 * @module distribution
 *
 * Types and primitives for working with discrete probability distributions.
 *
 * A discrete distribution maps a finite set of numeric values to their
 * probabilities. All other statistical operations in this domain
 * (CDF, expected value, variance) consume the types defined here.
 */

/**
 * A single possible outcome with an associated relative weight.
 *
 * Weights do not need to sum to any particular value; they are normalized
 * internally by `discreteProbability`. This lets callers express counts,
 * frequencies, or arbitrary positive numbers without pre-normalizing.
 */
export interface Outcome {
  readonly value: number;
  readonly weight: number;
}

/**
 * A single entry in a normalized discrete probability distribution.
 * The probability is guaranteed to be in the range (0, 1].
 */
export interface ProbabilityEntry {
  readonly value: number;
  readonly probability: number;
}

/**
 * A normalized discrete probability distribution.
 * Entries are sorted by value ascending and their probabilities sum to 1.
 */
export type Distribution = readonly ProbabilityEntry[];

/**
 * Builds a normalized discrete probability distribution from a list of
 * weighted outcomes.
 *
 * Each outcome's probability is proportional to its weight:
 *
 *   P(xᵢ) = wᵢ / Σⱼ wⱼ
 *
 * The result is sorted by value ascending so callers can assume a consistent
 * order (useful for CDF computation, rendering, etc.).
 *
 * @param outcomes - Non-empty array of outcomes. Each weight must be a
 *   positive finite number; each value must be a finite number.
 * @returns A normalized `Distribution` whose probabilities sum to 1.
 *
 * @throws {RangeError} If `outcomes` is empty, any weight is not a positive
 *   finite number, or any value is not finite.
 *
 * @example
 * // Fair six-sided die
 * discreteProbability([
 *   { value: 1, weight: 1 },
 *   { value: 2, weight: 1 },
 *   { value: 3, weight: 1 },
 *   { value: 4, weight: 1 },
 *   { value: 5, weight: 1 },
 *   { value: 6, weight: 1 },
 * ]);
 * // → [{ value: 1, probability: 1/6 }, ..., { value: 6, probability: 1/6 }]
 *
 * // Loaded die: face 6 is twice as likely as any other
 * discreteProbability([
 *   { value: 1, weight: 1 },
 *   ...
 *   { value: 6, weight: 2 },
 * ]);
 */
export function discreteProbability(outcomes: readonly Outcome[]): Distribution {
  if (outcomes.length === 0) {
    throw new RangeError('discreteProbability: outcomes must not be empty');
  }

  for (const { value, weight } of outcomes) {
    if (!Number.isFinite(value)) {
      throw new RangeError(
        `discreteProbability: value must be finite, got ${value}`,
      );
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new RangeError(
        `discreteProbability: weight must be a positive finite number, got ${weight}`,
      );
    }
  }

  // P(xᵢ) = wᵢ / Σⱼ wⱼ
  const totalWeight = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);

  return outcomes
    .map(({ value, weight }) => ({ value, probability: weight / totalWeight }))
    .sort((a, b) => a.value - b.value);
}

/**
 * Computes the expected value (mean) of a discrete probability distribution.
 *
 *   E[X] = Σᵢ xᵢ · P(xᵢ)
 *
 * The expected value is the probability-weighted average of all possible
 * outcomes. It does not need to be one of the outcomes themselves (e.g. E[X]
 * for a fair die is 3.5, which is not a face value).
 *
 * @param dist - A normalized discrete distribution (as returned by
 *   `discreteProbability`).
 * @returns The expected value of the distribution.
 *
 * @example
 * expectedValue(fairD6) // → 3.5
 */
export function expectedValue(dist: Distribution): number {
  // E[X] = Σᵢ xᵢ · P(xᵢ)
  return dist.reduce(
    (sum, { value, probability }) => sum + value * probability,
    0,
  );
}

/**
 * Computes the variance of a discrete probability distribution.
 *
 * Uses the computational form to avoid two passes over the distribution:
 *
 *   Var[X] = E[X²] − (E[X])²
 *
 * where E[X²] = Σᵢ xᵢ² · P(xᵢ)
 *
 * Variance measures how spread out the outcomes are around the mean.
 * Its square root is the standard deviation.
 *
 * @param dist - A normalized discrete distribution.
 * @returns The variance of the distribution. Always ≥ 0.
 *
 * @example
 * variance(fairD6) // → 35/12 ≈ 2.9167
 */
export function variance(dist: Distribution): number {
  // Var[X] = E[X²] − (E[X])²
  const mean = expectedValue(dist);
  const meanOfSquares = dist.reduce(
    (sum, { value, probability }) => sum + value ** 2 * probability,
    0,
  );
  return meanOfSquares - mean ** 2;
}

/**
 * Computes the cumulative distribution function (CDF) evaluated at x.
 *
 *   F(x) = P(X ≤ x) = Σ { P(xᵢ) : xᵢ ≤ x }
 *
 * The CDF answers: "what is the probability that the outcome is at most x?"
 * Its complement, 1 − F(x), answers: "what is the probability of getting
 * strictly more than x?" — useful for "at least" queries in game scenarios.
 *
 * @param dist - A normalized discrete distribution, sorted by value ascending.
 * @param x    - The threshold value.
 * @returns A value in [0, 1]. Returns 0 if x is below all outcomes; returns 1
 *   if x is at or above all outcomes.
 *
 * @example
 * cumulativeProbability(fairD6, 3) // → 0.5  (P(X ≤ 3))
 * 1 - cumulativeProbability(fairD6, 3) // → 0.5  (P(X > 3), i.e. "at least 4")
 */
export function cumulativeProbability(dist: Distribution, x: number): number {
  // F(x) = Σ { P(xᵢ) : xᵢ ≤ x }
  return dist
    .filter(entry => entry.value <= x)
    .reduce((sum, entry) => sum + entry.probability, 0);
}
