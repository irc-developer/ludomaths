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

import { chosenSaveThreshold, dieSuccessProbability, woundThreshold } from '@domain/dice/combat';
import { WeaponGroup, WeaponProfile } from '@domain/dice/weapon';
import { SavePool } from '@domain/dice/savePool';
import { Distribution } from '@domain/math/distribution';
import { convolve, multiConvolve } from '@domain/math/convolution';
import { applyDamage, applyStage } from '@domain/math/pipeline';

// Re-exported so existing callers that import WeaponGroup / SavePool from
// this module continue to work without changes.
export type { WeaponGroup } from '@domain/dice/weapon';
export type { SavePool } from '@domain/dice/savePool';



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

      const { attacksDist, hitThreshold, hitModifier, hitReroll, strengthDist, woundModifier, woundReroll, ap, damageDist, modelCount } = group;

      // Stage 1: Attacks → Hits
      // multiConvolve inflates the attack distribution so all models in the
      // group fire as one combined pool.
      const totalAttacksDist = multiConvolve(attacksDist, modelCount);
      const hitProbability = dieSuccessProbability(hitThreshold, hitModifier ?? 0, hitReroll ?? 'none');
      const hitDist = applyStage(totalAttacksDist, hitProbability);

      // Stage 2: Hits → Wounds
      // Strength may be variable. Each possible strength value contributes
      // its wound probability weighted by P(S = s):
      //
      //   p_wound = Σ_s  P(S = s) · dieSuccessProbability(woundThreshold(s, T), modifier, reroll)
      const woundProbability = strengthDist.reduce(
        (acc, { value: s, probability: pS }) =>
          acc + pS * dieSuccessProbability(woundThreshold(s, toughness), woundModifier ?? 0, woundReroll ?? 'none'),
        0,
      );
      const woundDist = applyStage(hitDist, woundProbability);

      // Stage 3+4(+5): Wounds → per-pool unsaved → per-pool damage → optional FNP
      //
      // applyDamage is moved inside the pool loop so FNP can be applied per pool
      // before the distributions are convolved. This is mathematically equivalent
      // to the previous approach (single applyDamage after convolve) because:
      //   applyDamage(convolve(A, B), d) = convolve(applyDamage(A, d), applyDamage(B, d))
      // (sum of N=A+B independent draws equals the sum of A draws convolved with B draws).
      const poolFinalDists: Distribution[] = savePools.map(pool => {
        const poolWoundDist = applyStage(woundDist, pool.fraction);
        const saveThreshold = chosenSaveThreshold(pool.baseSave, ap, pool.invulnerableSave);
        // 1 − P(save success): dieSuccessProbability handles threshold > 6 (returns 0)
        // so failSaveProbability = 1 when the save is impossible, naturally.
        const failSaveProbability = 1 - dieSuccessProbability(saveThreshold, pool.saveModifier ?? 0, pool.saveReroll ?? 'none');
        const poolUnsavedDist = applyStage(poolWoundDist, failSaveProbability);

        // Stage 4: unsaved wounds → damage for this pool
        const poolDamageDist = applyDamage(poolUnsavedDist, damageDist);

        // Stage 5 (optional): Feel No Pain
        // Each damage point is independently negated on a roll ≥ fnpThreshold.
        // P(damage survives FNP) = 1 − dieSuccessProbability(fnpThreshold)
        if (pool.fnpThreshold !== undefined) {
          const pFailFNP = 1 - dieSuccessProbability(pool.fnpThreshold);
          return applyStage(poolDamageDist, pFailFNP);
        }

        return poolDamageDist;
      });

      const groupDamageDist = poolFinalDists.reduce((acc, dist) => convolve(acc, dist));
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
