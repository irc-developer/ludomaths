/**
 * @module combinatorics
 *
 * Pure combinatorial primitives with no game-specific knowledge.
 * These functions are the building blocks for all probability calculations
 * in the domain (binomial, hypergeometric, multinomial distributions, etc.).
 *
 * All functions are stateless and free of side effects.
 */

/**
 * Computes the binomial coefficient C(n, k), read "n choose k".
 *
 * It represents the number of ways to choose k elements from a set of n
 * **without** regard to order and **without** replacement.
 *
 * Formula:
 *
 *   C(n, k) = n! / (k! · (n − k)!)
 *
 * This implementation uses the multiplicative form to avoid computing large
 * intermediate factorials and to keep every partial result an integer:
 *
 *   C(n, k) = ∏ᵢ₌₁ᵏ  (n − k + i) / i
 *
 * The product is evaluated left-to-right; at each step i the accumulated
 * numerator is divisible by i (a classical number-theory result), so no
 * floating-point rounding accumulates.
 *
 * Time complexity : O(min(k, n−k))
 * Space complexity: O(1)
 *
 * @param n - Total number of elements in the set. Must be a non-negative integer.
 * @param k - Number of elements to choose. Must satisfy 0 ≤ k ≤ n.
 * @returns  The exact integer value of C(n, k).
 *
 * @throws {RangeError} If n or k are not non-negative integers, or if k > n.
 *
 * @example
 * binomialCoefficient(5, 2)  // → 10   (pairs from {1,2,3,4,5})
 * binomialCoefficient(52, 5) // → 2 598 960  (5-card hands from a standard deck)
 * binomialCoefficient(10, 0) // → 1
 * binomialCoefficient(7, 7)  // → 1
 */
export function binomialCoefficient(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k)) {
    throw new RangeError(
      `binomialCoefficient: n and k must be integers, got n=${n}, k=${k}`,
    );
  }
  if (n < 0 || k < 0) {
    throw new RangeError(
      `binomialCoefficient: n and k must be non-negative, got n=${n}, k=${k}`,
    );
  }
  if (k > n) {
    throw new RangeError(
      `binomialCoefficient: k must be ≤ n, got n=${n}, k=${k}`,
    );
  }

  // Exploit symmetry C(n, k) = C(n, n-k) to halve the number of iterations.
  const effectiveK = k > n - k ? n - k : k;

  // C(n, k) = ∏ᵢ₌₁ᵏ  (n − k + i) / i
  let result = 1;
  for (let i = 1; i <= effectiveK; i++) {
    result = (result * (n - effectiveK + i)) / i;
  }

  return result;
}
