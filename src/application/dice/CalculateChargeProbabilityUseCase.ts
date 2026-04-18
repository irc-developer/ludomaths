/**
 * @module CalculateChargeProbabilityUseCase
 *
 * Computes the probability that a WH40K charge attempt succeeds.
 *
 * A charge is declared at a target at distance d (in inches). The player
 * rolls 2D6; if the result is ≥ d the charge succeeds and the miniature
 * moves into base contact.
 *
 *   P(success) = P(2D6 ≥ d) = 1 − F_{2D6}(d − 1)
 *
 * Valid distances: integers in [2, 13].
 * - Distance 2 is always successful (minimum 2D6 roll is 2).
 * - Distance > 12 is always impossible (maximum 2D6 roll is 12).
 * - Distance 13 is accepted and returns 0 (useful for callers that
 *   derive distance from measurement and may get 13).
 */

import { Distribution, cumulativeProbability, discreteProbability } from '@domain/math/distribution';
import { multiConvolve } from '@domain/math/convolution';

export interface ChargeInput {
  /** Target distance in inches. Must be an integer ≥ 2. */
  distance: number;
  /**
   * Optional re-roll policy for the entire 2D6 charge roll.
   * 'failures': re-roll the whole 2D6 if the charge fails.
   * Defaults to 'none'.
   */
  reroll?: 'none' | 'failures';
}

export interface ChargeResult {
  /** Probability that 2D6 ≥ distance. In [0, 1]. */
  probability: number;
  /** Full probability distribution of the 2D6 roll (values 2–12). */
  rollDist: Distribution;
}

// Fair D6 — built once, reused across all executions.
const D6: Distribution = discreteProbability([
  { value: 1, weight: 1 },
  { value: 2, weight: 1 },
  { value: 3, weight: 1 },
  { value: 4, weight: 1 },
  { value: 5, weight: 1 },
  { value: 6, weight: 1 },
]);

// 2D6 distribution — 11 entries, values 2–12.
const TWO_D6: Distribution = multiConvolve(D6, 2);

export class CalculateChargeProbabilityUseCase {
  execute(input: ChargeInput): ChargeResult {
    const { distance, reroll = 'none' } = input;

    if (!Number.isInteger(distance) || distance < 2) {
      throw new RangeError(
        `CalculateChargeProbabilityUseCase: distance must be an integer ≥ 2, got ${distance}`,
      );
    }

    // P(2D6 ≥ d) = 1 − P(2D6 ≤ d − 1) = 1 − F_{2D6}(d − 1)
    // Clamp to [0, 1] to absorb floating-point rounding (e.g. 1 - 1.0 = -2e-16).
    const p = Math.max(0, Math.min(1, 1 - cumulativeProbability(TWO_D6, distance - 1)));

    // reroll 'failures': the whole 2D6 is re-rolled if the first attempt fails.
    //   P(success) = p + (1−p)·p = p·(2−p)
    const probability = reroll === 'failures' ? p * (2 - p) : p;

    return { probability, rollDist: TWO_D6 };
  }
}
