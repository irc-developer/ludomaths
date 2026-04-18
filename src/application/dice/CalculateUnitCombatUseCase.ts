/**
 * @module CalculateUnitCombatUseCase
 *
 * Orchestrates WH40K combat for a full unit:
 *
 *   [weapon group 1] ─┐
 *   [weapon group 2] ─┤──► convolve damages ──► totalDamageDist
 *   [weapon group N] ─┘
 *
 * Each weapon group runs the following pipeline:
 *
 *   Stage 1  attacks  → hits
 *              [SUSTAINED HITS X]: critical hit (6) → X extra hits
 *              [LETHAL HITS]:      critical hit (6) → auto-wound (skip wound roll)
 *   Stage 2  hits     → wounds
 *              [DEVASTATING WOUNDS]: critical wound (6) → bypass save
 *   Stage 3  wounds split by save pool fraction
 *   Stage 4  normal wounds → save roll → unsaved wounds → damage
 *              critical wounds (devastating) bypass this stage
 *   Stage 5  (optional) damage → Feel No Pain
 *   Post     [MORTAL WOUNDS per hit]: each hit → Y extra mortal wounds
 *              bypass saves, still subject to FNP
 *
 * Save pools model units where different miniatures carry different armor
 * values. Each pool receives a fraction of the total wounds and applies its
 * own save independently. The damage distributions from all pools are then
 * convolved into a single result per weapon group.
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

      const {
        attacksDist, hitThreshold, hitModifier, hitReroll,
        strengthDist, woundModifier, woundReroll,
        ap, damageDist, modelCount,
        sustainedHits, lethalHits, devastatingWounds, mortalWoundsPerHit,
      } = group;

      // ── Stage 1: Attacks → Hits ──────────────────────────────────────────
      //
      // When [LETHAL HITS] or [SUSTAINED HITS] are active, critical hit rolls
      // (unmodified 6, possibly after rerolls) are tracked separately.
      // Otherwise, all hits enter the wound roll together.
      //
      // allHitsDist tracks every successful hit including crits, used later
      // by [MORTAL WOUNDS per hit].
      const totalAttacksDist = multiConvolve(attacksDist, modelCount);
      const pAllHits = dieSuccessProbability(hitThreshold, hitModifier ?? 0, hitReroll ?? 'none');

      let hitsDist: Distribution;        // proceed to wound roll
      let autoWoundsDist: Distribution;  // bypass wound roll ([LETHAL HITS])
      let allHitsDist: Distribution;     // every hit (for [MORTAL WOUNDS per hit])

      const hasCritHitAbility = lethalHits === true || (sustainedHits ?? 0) > 0;

      if (hasCritHitAbility) {
        // P(unmodified 6 on attack die after rerolls).
        // Critical hit threshold is always 6 regardless of hitModifier.
        const pCritHit  = dieSuccessProbability(6, 0, hitReroll ?? 'none');
        const pNormHit  = Math.max(0, pAllHits - pCritHit);
        const critHitsDist = applyStage(totalAttacksDist, pCritHit);
        const normHitsDist = applyStage(totalAttacksDist, pNormHit);

        // [LETHAL HITS]: critical hits bypass the wound roll (auto-wound).
        autoWoundsDist = lethalHits === true ? critHitsDist : DEGENERATE_ZERO;

        // [SUSTAINED HITS X]: critical hits generate X additional normal hits.
        //   applyDamage models "k crits each producing X extra" as a scaled sum:
        //   P(extra = j) = P(Bin(N, pCrit) = j / X).
        const X = sustainedHits ?? 0;
        const extraHitsDist = X > 0
          ? applyDamage(critHitsDist, [{ value: X, probability: 1 }])
          : DEGENERATE_ZERO;

        if (lethalHits === true) {
          // Crits auto-wound: only normal hits + Sustained extras go to wound roll.
          hitsDist    = X > 0 ? convolve(normHitsDist, extraHitsDist) : normHitsDist;
          // All hits (including auto-wounding crits) count for mortal wounds.
          allHitsDist = convolve(critHitsDist, hitsDist);
        } else {
          // No Lethal Hits: crits participate in wound roll as normal hits.
          const allRegularHits = applyStage(totalAttacksDist, pAllHits);
          hitsDist    = X > 0 ? convolve(allRegularHits, extraHitsDist) : allRegularHits;
          allHitsDist = hitsDist;
        }
      } else {
        hitsDist      = applyStage(totalAttacksDist, pAllHits);
        autoWoundsDist = DEGENERATE_ZERO;
        allHitsDist   = hitsDist;
      }

      // ── Stage 2: Hits → Wounds ───────────────────────────────────────────
      //
      // Strength may be variable. Each possible strength value contributes
      // its wound probability weighted by P(S = s):
      //
      //   p_wound = Σ_s P(S=s) · dieSuccessProbability(woundThreshold(s,T), modifier, reroll)
      const woundProbability = strengthDist.reduce(
        (acc, { value: s, probability: pS }) =>
          acc + pS * dieSuccessProbability(woundThreshold(s, toughness), woundModifier ?? 0, woundReroll ?? 'none'),
        0,
      );

      // [DEVASTATING WOUNDS]: critical wounds (unmodified 6, possibly after rerolls)
      // bypass all saves. The remaining wound probability goes through save rolls.
      let critWoundsDist: Distribution;    // bypass saves
      let normalWoundsDist: Distribution;  // proceed to save roll

      if (devastatingWounds === true) {
        // P(unmodified 6 on wound die after rerolls).
        const pCritWound   = dieSuccessProbability(6, 0, woundReroll ?? 'none');
        const pNormWound   = Math.max(0, woundProbability - pCritWound);
        critWoundsDist     = applyStage(hitsDist, pCritWound);
        const normFromHits = applyStage(hitsDist, pNormWound);
        // [LETHAL HITS] auto-wounds go through saves (they are not devastating).
        normalWoundsDist   = convolve(normFromHits, autoWoundsDist);
      } else {
        critWoundsDist   = DEGENERATE_ZERO;
        const woundsFromHits = applyStage(hitsDist, woundProbability);
        normalWoundsDist     = convolve(woundsFromHits, autoWoundsDist);
      }

      // ── Stage 3+4(+5): Wounds → per-pool unsaved → damage → FNP ─────────
      //
      // applyDamage is inside the pool loop so FNP can be applied per pool
      // before the distributions are convolved (distributivity of binomial
      // thinning over convolution guarantees this is mathematically correct).
      const poolFinalDists: Distribution[] = savePools.map(pool => {
        // Critical wounds bypass saves, split by pool fraction.
        const poolCritWoundDist = applyStage(critWoundsDist, pool.fraction);
        // Normal wounds go through saves, split by pool fraction.
        const poolNormWoundDist = applyStage(normalWoundsDist, pool.fraction);
        const saveThreshold     = chosenSaveThreshold(pool.baseSave, ap, pool.invulnerableSave);
        const failSaveProbability =
          1 - dieSuccessProbability(saveThreshold, pool.saveModifier ?? 0, pool.saveReroll ?? 'none');
        const poolUnsavedDist   = applyStage(poolNormWoundDist, failSaveProbability);

        // Critical wounds (devastating) + unsaved normal wounds deal damage.
        const poolAllWoundsDist = convolve(poolCritWoundDist, poolUnsavedDist);
        let poolDamageDist = applyDamage(poolAllWoundsDist, damageDist);

        // Stage 5 (optional): Feel No Pain
        // Each damage point is independently negated on a roll ≥ fnpThreshold.
        // Applies to ALL damage, including devastating wound (mortal-wound) damage.
        if (pool.fnpThreshold !== undefined) {
          const pFailFNP = 1 - dieSuccessProbability(pool.fnpThreshold);
          poolDamageDist = applyStage(poolDamageDist, pFailFNP);
        }

        return poolDamageDist;
      });

      let groupDamageDist = poolFinalDists.reduce((acc, dist) => convolve(acc, dist));

      // ── [MORTAL WOUNDS per hit] ──────────────────────────────────────────
      //
      // Each hit (including critical hits and Sustained extra hits) generates
      // Y additional mortal wounds that bypass saves. FNP still applies.
      //
      // For multi-pool units the first pool's FNP is used as an approximation
      // (exact only when all pools share the same FNP threshold).
      const Y = mortalWoundsPerHit ?? 0;
      if (Y > 0) {
        const mortalBase    = applyDamage(allHitsDist, [{ value: Y, probability: 1 }]);
        const firstPool     = savePools[0];
        const mortalPostFNP = firstPool.fnpThreshold !== undefined
          ? applyStage(mortalBase, 1 - dieSuccessProbability(firstPool.fnpThreshold))
          : mortalBase;
        groupDamageDist = convolve(groupDamageDist, mortalPostFNP);
      }

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
