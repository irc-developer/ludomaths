/**
 * @module CalculateUnitCombatUseCase
 *
 * Orchestrates WH40K combat for a full unit:
 *
 *   [weapon group 1] ─┐
 *   [weapon group 2] ─┤──► convolve damages ──► totalDamageDist
 *   [weapon group N] ─┘
 *
 * Each weapon group runs its own four-stage pipeline:
 *   attacks → hits → wounds → [split by save pool] → unsaved → damage
 *
 * Save pools model units where different miniatures carry different armor
 * values. Each pool receives a fraction of the total wounds and applies its
 * own save independently. The damage distributions from all pools are then
 * convolved into a single result per weapon group.
 *
 * Model count is handled by inflating the attacks distribution via
 * multiConvolve before entering the pipeline. This is equivalent to running
 * N independent pipelines and convolving the results (distributivity of
 * binomial thinning over convolution).
 */

import { chosenSaveThreshold, woundThreshold } from '@domain/dice/combat';
import { Distribution } from '@domain/math/distribution';
import { applyDamage, applyStage } from '@domain/math/pipeline';
import { convolve, multiConvolve } from '@domain/math/convolution';
import { WeaponProfile } from './CalculateCombatResultUseCase';

/** A weapon group: one weapon profile shared by `modelCount` models. */
export interface WeaponGroup extends WeaponProfile {
  /** Number of models carrying this weapon. Must be a non-negative integer. */
  modelCount: number;
}

/**
 * A pool of wounds directed at a subset of the defending unit.
 * `fraction` is the proportion of wounds that go to models with `baseSave`.
 * All fractions across the pool list must sum to 1.
 */
export interface SavePool {
  baseSave: number;
  /** Fraction of wounds directed to this pool. Must be in (0, 1]. */
  fraction: number;
  /** Optional unmodifiable save. When provided, the best of armor and invulnerable is used. */
  invulnerableSave?: number;
}

export interface UnitCombatInput {
  weaponGroups: WeaponGroup[];
  /** Toughness of the target unit (assumed uniform across the unit). */
  toughness: number;
  savePools: SavePool[];
}

export interface UnitCombatResult {
  /** Full probability distribution of total damage dealt by the unit. */
  totalDamageDist: Distribution;
}

const DEGENERATE_ZERO: Distribution = [{ value: 0, probability: 1 }];

export class CalculateUnitCombatUseCase {
  execute(input: UnitCombatInput): UnitCombatResult {
    const { weaponGroups, toughness, savePools } = input;

    // ── Validate inputs ────────────────────────────────────────────────────
    if (weaponGroups.length === 0) {
      throw new RangeError('weaponGroups must not be empty');
    }

    if (savePools.length === 0) {
      throw new RangeError('savePools must not be empty');
    }

    const fractionSum = savePools.reduce((acc, p) => acc + p.fraction, 0);
    if (Math.abs(fractionSum - 1) > 1e-9) {
      throw new RangeError(
        `Save pool fractions must sum to 1, got ${fractionSum}`,
      );
    }

    for (const group of weaponGroups) {
      if (!Number.isInteger(group.modelCount) || group.modelCount < 0) {
        throw new RangeError(
          `modelCount must be a non-negative integer, got ${group.modelCount}`,
        );
      }
    }

    // ── Per-group pipeline ─────────────────────────────────────────────────
    const groupDamageDists: Distribution[] = [];

    for (const group of weaponGroups) {
      if (group.modelCount === 0) continue;

      const { attacksDist, hitThreshold, strengthDist, ap, damageDist, modelCount } = group;

      // Stage 1: Attacks → Hits
      // multiConvolve inflates the attack distribution so all models in the
      // group fire as one combined pool.
      const totalAttacksDist = multiConvolve(attacksDist, modelCount);
      const hitProbability = hitThreshold > 6 ? 0 : (7 - hitThreshold) / 6;
      const hitDist = applyStage(totalAttacksDist, hitProbability);

      // Stage 2: Hits → Wounds
      // Strength may be variable. Each possible strength value contributes
      // its wound probability weighted by P(S = s):
      //
      //   p_wound = Σ_s  P(S = s) · (7 − woundThreshold(s, T)) / 6
      const woundProbability = strengthDist.reduce(
        (acc, { value: s, probability: pS }) => acc + pS * ((7 - woundThreshold(s, toughness)) / 6),
        0,
      );
      const woundDist = applyStage(hitDist, woundProbability);

      // Stage 3: Wounds → Unsaved Wounds (per save pool)
      // Each wound independently goes to pool i with probability pool.fraction.
      // applyStage(woundDist, fraction) models this as a binomial split.
      // The unsaved distributions from all pools are then convolved together.
      const unsavedDists: Distribution[] = savePools.map(pool => {
        const poolWoundDist = applyStage(woundDist, pool.fraction);
        const effectiveSave = chosenSaveThreshold(pool.baseSave, ap, pool.invulnerableSave);
        // P(fail save) = (threshold - 1) / 6  — see CalculateCombatResultUseCase for rationale
        const failSaveProbability = effectiveSave > 6 ? 1 : (effectiveSave - 1) / 6;
        return applyStage(poolWoundDist, failSaveProbability);
      });

      const totalUnsavedDist = unsavedDists.reduce((acc, dist) => convolve(acc, dist));

      // Stage 4: Unsaved Wounds → Damage
      const groupDamageDist = applyDamage(totalUnsavedDist, damageDist);
      groupDamageDists.push(groupDamageDist);
    }

    // All models have modelCount=0 → no damage
    if (groupDamageDists.length === 0) {
      return { totalDamageDist: DEGENERATE_ZERO };
    }

    const totalDamageDist = groupDamageDists.reduce((acc, dist) => convolve(acc, dist));
    return { totalDamageDist };
  }
}
