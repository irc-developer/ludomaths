/**
 * @module lorcana
 *
 * Lorcana-specific probability rules built on top of the hypergeometric
 * distribution. Functions here encode game rules (deck size, mulligan policy)
 * rather than pure math, which is why they live in domain/cards rather than
 * domain/math.
 */

import { hypergeometricAtMost } from '../math/hypergeometric';

/**
 * Probability of drawing at least k copies of a target card in a Lorcana
 * opening hand, accounting for the free mulligan.
 *
 * Lorcana mulligan rule: if unsatisfied with the opening hand of `handSize`
 * cards, the player returns all of them to the deck, shuffles, and draws a new
 * hand of the same size. Because the deck is fully shuffled before each draw,
 * both hands are drawn from the same population — they are independent.
 *
 *   P(at least k in at least one hand)
 *     = 1 − P(fewer than k in first hand)²
 *     = 1 − P(X < k)²
 *     = 1 − hypergeometricAtMost(N, K, handSize, k−1)²
 *
 * @param N        - Total deck size (60 in standard Lorcana).
 * @param K        - Copies of the target card in the deck (max 4).
 * @param handSize - Cards drawn per hand (7 in standard Lorcana).
 * @param k        - Minimum desired copies of the target in hand.
 *
 * @throws {RangeError} Delegates to hypergeometricAtMost for invalid inputs.
 */
export function mulliganAtLeast(
  N: number,
  K: number,
  handSize: number,
  k: number,
): number {
  if (k <= 0) return 1;

  // P(not reaching k in a single hand) = P(X ≤ k−1)
  const pFail = hypergeometricAtMost(N, K, handSize, k - 1);

  // P(at least k after mulligan) = 1 − pFail²
  return 1 - pFail * pFail;
}


