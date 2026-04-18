/**
 * @module CalculateRoundsToKillUseCase
 *
 * Given a weapon unit and a target with N total wounds, computes the
 * probability distribution of the number of shooting rounds needed to kill
 * the target.
 *
 * # Math
 *
 * Let D be the damage distribution for one round (from CalculateUnitCombatUseCase).
 * Let D_n = D₁ + D₂ + ... + D_n be the cumulative damage after n rounds
 * (i.e. multiConvolve(D, n)).
 *
 * P(kill by round n) = P(D_n ≥ W) = 1 − cumulativeProbability(D_n, W − 1)
 *
 * P(kill in exactly round n) = P(kill by round n) − P(kill by round n − 1)
 *
 * E[rounds to kill] ≈ Σ_{n=1}^{maxRounds} n × P(kill in round n)
 * (Approximation improves as maxRounds grows. For high-damage units the loop
 *  exits early once P(kill by round n) ≈ 1.)
 *
 * # Performance note
 *
 * D_n is computed incrementally: D_n = convolve(D_{n−1}, D), starting from
 * the degenerate distribution at 0 (the identity for convolution).
 * This avoids recomputing multiConvolve from scratch each round.
 */

import { Distribution, cumulativeProbability } from '@domain/math/distribution';
import { convolve } from '@domain/math/convolution';
import { WeaponGroup } from '@domain/dice/weapon';
import { SavePool } from '@domain/dice/savePool';
import { CalculateUnitCombatUseCase } from './CalculateUnitCombatUseCase';

export interface RoundsToKillInput {
  weaponGroups: WeaponGroup[];
  toughness: number;
  savePools: SavePool[];
  /** Total wounds of the target unit. Must be a positive integer. */
  targetWounds: number;
  /**
   * Maximum number of rounds to compute.
   * The loop may exit earlier if P(kill) reaches 1 − 1e-9.
   * Must be a positive integer.
   */
  maxRounds: number;
}

export interface RoundEntry {
  /** Round number (1-indexed). */
  round: number;
  /** P(kill in exactly this round). */
  probability: number;
  /** P(kill in this round or any earlier round). */
  cumulativeProbability: number;
}

export interface RoundsToKillResult {
  /**
   * One entry per computed round (length ≤ maxRounds).
   * May be shorter than maxRounds when P(kill) reaches 1 before exhausting the loop.
   */
  killByRound: RoundEntry[];
  /**
   * Weighted average rounds to kill: Σ n × P(kill in round n) over all entries.
   * Underestimates the true E[T] only when maxRounds is too low and
   * P(kill by maxRounds) is meaningfully below 1.
   */
  expectedRounds: number;
  /** Damage distribution for a single round of shooting. */
  damagePerRoundDist: Distribution;
}

const DEGENERATE_ZERO: Distribution = [{ value: 0, probability: 1 }];

export class CalculateRoundsToKillUseCase {
  private readonly unitCase = new CalculateUnitCombatUseCase();

  execute(input: RoundsToKillInput): RoundsToKillResult {
    const { weaponGroups, toughness, savePools, targetWounds, maxRounds } = input;

    // ── Validate inputs ────────────────────────────────────────────────────
    if (!Number.isInteger(targetWounds) || targetWounds < 1) {
      throw new RangeError(
        `targetWounds must be a positive integer, got ${targetWounds}`,
      );
    }
    if (!Number.isInteger(maxRounds) || maxRounds < 1) {
      throw new RangeError(
        `maxRounds must be a positive integer, got ${maxRounds}`,
      );
    }

    // ── Damage distribution per round ──────────────────────────────────────
    const { totalDamageDist: damagePerRoundDist } = this.unitCase.execute({
      weaponGroups,
      toughness,
      savePools,
    });

    // ── Iterate rounds ─────────────────────────────────────────────────────
    // D_n accumulates damage after n rounds via incremental convolution.
    // Starting from DEGENERATE_ZERO (identity for convolution) means:
    //   convolve(ZERO, D) = D   (round 1)
    //   convolve(D, D) = D₂    (round 2) … etc.
    //
    // P(kill by round n) = 1 − cumulativeProbability(D_n, W − 1)
    const killByRound: RoundEntry[] = [];
    let roundDamageDist: Distribution = DEGENERATE_ZERO;
    let prevCumulativeProb = 0;
    let expectedRounds = 0;

    for (let n = 1; n <= maxRounds; n++) {
      roundDamageDist = convolve(roundDamageDist, damagePerRoundDist);

      // P(total after n rounds ≥ W) = 1 − P(total ≤ W − 1)
      const cumulativeProb = Math.min(
        1,
        1 - cumulativeProbability(roundDamageDist, targetWounds - 1),
      );
      const prob = cumulativeProb - prevCumulativeProb;

      killByRound.push({ round: n, probability: prob, cumulativeProbability: cumulativeProb });
      expectedRounds += n * prob;
      prevCumulativeProb = cumulativeProb;

      // Early exit: kill is practically certain; further rounds add no information
      // and continuing would only bloat roundDamageDist size exponentially.
      if (cumulativeProb >= 1 - 1e-9) break;
    }

    return { killByRound, expectedRounds, damagePerRoundDist };
  }
}
