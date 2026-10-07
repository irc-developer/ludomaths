/** Exact absorption time for one miniature with identical independent rounds. */

import { Distribution } from '@domain/math/distribution';
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
  survivingProbability: number;
  horizonLimited: boolean;
  calculationScope?: 'single-miniature' | 'legacy-approximation';
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
    const { totalDamageDist: damagePerRoundDist, calculationScope } = this.unitCase.execute({
      weaponGroups,
      toughness,
      savePools,
    });

    if (targetWounds > 500 || maxRounds > 1000) throw new RangeError('Calculation limit exceeded');
    // E[w] = (1 + sum_(d>0) P(d) E[max(0,w-d)]) / P(D>0).
    // This solves the self-loop at zero damage without truncating the expectation.
    const positive = damagePerRoundDist.filter(entry => entry.value > 0);
    const progress = positive.reduce((sum, entry) => sum + entry.probability, 0);
    const expectations = new Float64Array(targetWounds + 1);
    for (let w = 1; w <= targetWounds; w++) {
      expectations[w] = progress === 0 ? Infinity :
        (1 + positive.reduce((sum, entry) => sum + entry.probability * expectations[Math.max(0, w - entry.value)], 0)) / progress;
    }
    const killByRound: RoundEntry[] = [];
    let surviving = new Float64Array(targetWounds);
    surviving[0] = 1;
    let cumulative = 0;
    let operations = 0;
    let horizonLimited = false;
    for (let round = 1; round <= maxRounds; round++) {
      const stepOperations = surviving.reduce((sum, mass) => sum + (mass > 0 ? damagePerRoundDist.length : 0), 0);
      if (operations + stepOperations > 2000000) { horizonLimited = true; break; }
      operations += stepOperations;
      const next = new Float64Array(targetWounds);
      let absorbed = 0;
      for (let w = 0; w < targetWounds; w++) {
        if (surviving[w] === 0) continue;
        for (const entry of damagePerRoundDist) {
          const mass = surviving[w] * entry.probability;
          if (w + entry.value >= targetWounds) absorbed += mass;
          else next[w + entry.value] += mass;
        }
      }
      cumulative = Math.min(1, cumulative + absorbed);
      killByRound.push({ round, probability: absorbed, cumulativeProbability: cumulative });
      surviving = next;
      if (cumulative >= 1 - 1e-9) break;
    }
    const survivingProbability = surviving.reduce((sum, mass) => sum + mass, 0);
    return { killByRound, expectedRounds: expectations[targetWounds], damagePerRoundDist,
      survivingProbability, horizonLimited, calculationScope };
  }
}
