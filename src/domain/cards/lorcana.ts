/**
 * @module lorcana
 *
 * Lorcana-specific probability rules built on top of the hypergeometric
 * distribution. Functions here encode game rules (deck size, mulligan policy)
 * rather than pure math, which is why they live in domain/cards rather than
 * domain/math.
 */

import {
  hypergeometricAtMost,
  hypergeometricAtLeast,
  hypergeometricMean,
  multivariateHypergeometricProbability,
} from '../math/hypergeometric';

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

/**
 * Probability of being "on curve" at turn T: having inked on every turn from 1 to T.
 *
 * Assumes optimal play: the player inks whenever they have an inkable card available.
 * Under this assumption, the inkwell size at turn T is min(T, X) where X is the
 * number of inkable cards seen in the first handSize+T draws.
 *
 *   P(on curve at T) = P(X ≥ T)  where X ~ Hyper(N, K, handSize + T)
 *
 * Note: this is an upper-bound approximation. It models "have I seen enough inkable
 * cards?" but does not account for whether those cards were in hand on the exact
 * turns needed. For a 60-card Lorcana deck this approximation is tight.
 *
 * @param N        - Total deck size.
 * @param K        - Number of inkable cards in the deck.
 * @param T        - Turn number (1-based). T=0 returns 1 trivially.
 * @param handSize - Opening hand size (7 in standard Lorcana).
 *
 * @throws {RangeError} If handSize + T > N or K > N (via hypergeometricAtLeast).
 */
export function pOnCurveByTurn(N: number, K: number, T: number, handSize: number): number {
  if (T <= 0) return 1;
  // P(on curve at T) = P(X ≥ T)  where X ~ Hyper(N, K, handSize + T)
  return hypergeometricAtLeast(N, K, handSize + T, T);
}

/**
 * Expected inkwell size at the end of turn T under optimal play.
 *
 * The inkwell size at turn T is min(T, X) where X ~ Hyper(N, K, handSize+T).
 * By the tail-sum formula for bounded non-negative integers:
 *
 *   E[min(T, X)] = Σ_{k=1}^{T} P(X ≥ k)
 *
 * @param N        - Total deck size.
 * @param K        - Number of inkable cards in the deck.
 * @param T        - Turn number (1-based). T=0 returns 0.
 * @param handSize - Opening hand size (7 in standard Lorcana).
 *
 * @throws {RangeError} If handSize + T > N or K > N (via hypergeometricAtLeast).
 */
export function expectedInkByTurn(N: number, K: number, T: number, handSize: number): number {
  if (T <= 0) return 0;
  // E[min(T, X)] = Σ_{k=1}^{T} P(X ≥ k)  where X ~ Hyper(N, K, handSize + T)
  let total = 0;
  for (let k = 1; k <= T; k++) {
    total += hypergeometricAtLeast(N, K, handSize + T, k);
  }
  return total;
}

/**
 * Probability of being on curve at turn T when the deck contains cards that
 * grant extra ink when played.
 *
 * Models two disjoint card populations:
 * - K inkable cards: contribute at most 1 ink per turn (normal ink curve).
 * - E extra-ink cards: each one seen and played adds +1 ink on top.
 *
 * Assumption: all extra-ink cards seen by turn T are played (optimistic upper
 * bound that ignores cost constraints). In practice this is tight for low-cost
 * extra-ink effects common in Lorcana.
 *
 * Total ink at turn T = min(T, X_ink) + X_extra
 * where X_ink ~ marginal Hyper(N, K, handSize+T)
 * and   X_extra ~ marginal Hyper(N, E, handSize+T)
 * but (X_ink, X_extra) are NOT independent — uses bivariate PMF.
 *
 *   P(on curve with bonus)
 *     = Σ_{i,j} P(X_ink=i, X_extra=j) · 1[min(T,i) + j ≥ T]
 *     = Σ_{i=0}^{K} Σ_{j=max(0,T-i)}^{E} P(X_ink=i, X_extra=j)
 *
 * @param N        - Total deck size.
 * @param K        - Inkable cards (normal ink source).
 * @param E        - Extra-ink-granting cards. Must satisfy K + E ≤ N.
 * @param T        - Turn number (1-based). T=0 returns 1.
 * @param handSize - Opening hand size.
 *
 * @throws {RangeError} If K + E > N or handSize + T > N.
 */
export function pOnCurveByTurnWithBonus(
  N: number,
  K: number,
  E: number,
  T: number,
  handSize: number,
): number {
  if (T <= 0) return 1;
  const n = handSize + T;
  // validation is delegated to multivariateHypergeometricProbability on first call;
  // an explicit K+E check gives a clearer error message.
  if (K + E > N) {
    throw new RangeError(
      `pOnCurveByTurnWithBonus: K + E must be ≤ N, got K=${K}, E=${E}, N=${N}`,
    );
  }
  if (n > N) {
    throw new RangeError(
      `pOnCurveByTurnWithBonus: handSize + T must be ≤ N, got handSize=${handSize}, T=${T}, N=${N}`,
    );
  }

  // P(on curve) = Σ_{i=0}^{min(K,n)} Σ_{j=max(0,T-i)}^{min(E,n-i)} P(X_ink=i, X_extra=j)
  let total = 0;
  for (let i = 0; i <= Math.min(K, n); i++) {
    const jMin = Math.max(0, T - i);
    for (let j = jMin; j <= Math.min(E, n - i); j++) {
      total += multivariateHypergeometricProbability(N, K, E, n, i, j);
    }
  }
  return total;
}

/**
 * Expected total ink at turn T when the deck contains extra-ink-granting cards.
 *
 * By linearity of expectation (exact, not an approximation):
 *
 *   E[min(T, X_ink) + X_extra]
 *     = E[min(T, X_ink)] + E[X_extra]
 *     = expectedInkByTurn(N, K, T, handSize) + hypergeometricMean(N, E, handSize+T)
 *
 * This holds regardless of the correlation between X_ink and X_extra.
 *
 * @param N        - Total deck size.
 * @param K        - Inkable cards.
 * @param E        - Extra-ink-granting cards. Must satisfy K + E ≤ N.
 * @param T        - Turn number (1-based). T=0 returns 0.
 * @param handSize - Opening hand size.
 *
 * @throws {RangeError} If K + E > N or handSize + T > N.
 */
export function expectedInkByTurnWithBonus(
  N: number,
  K: number,
  E: number,
  T: number,
  handSize: number,
): number {
  if (T <= 0) return 0;
  if (K + E > N) {
    throw new RangeError(
      `expectedInkByTurnWithBonus: K + E must be ≤ N, got K=${K}, E=${E}, N=${N}`,
    );
  }
  // E[min(T,X_ink) + X_extra] = E[min(T,X_ink)] + E[X_extra]
  return expectedInkByTurn(N, K, T, handSize) + hypergeometricMean(N, E, handSize + T);
}


