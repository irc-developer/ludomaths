/**
 * @module CalculateCombatResultUseCase
 *
 * Orchestrates the full Warhammer 40K melee/ranged combat pipeline:
 *
 *   attacks → hits → wounds → unsaved wounds → total damage
 *
 * Each stage is independent and modelled as a probability distribution.
 * The use case composes the math primitives from domain/math with the
 * game-rule functions from domain/dice.
 *
 * Both fixed and variable inputs are supported:
 * - Fixed attacks: pass a degenerate distribution [{value: n, probability: 1}].
 * - Variable attacks (e.g. D6): pass the die distribution directly.
 * - Fixed strength/damage: same pattern.
 * - Variable strength: the use case computes a weighted effective wound
 *   probability by averaging over the strength distribution.
 */

import { chosenSaveThreshold, woundThreshold } from '@domain/dice/combat';
import { Distribution } from '@domain/math/distribution';
import { applyDamage, applyStage } from '@domain/math/pipeline';

/** Input profile for a weapon. All distributions support fixed values
 * (degenerate at a single point) or variable dice (full Distribution). */
export interface WeaponProfile {
  /** Distribution of the number of attacks. */
  attacksDist: Distribution;
  /** Minimum D6 result needed to hit (e.g. 3 means "3+"). */
  hitThreshold: number;
  /** Distribution of the weapon's Strength. */
  strengthDist: Distribution;
  /** Armor Penetration value. A non-negative integer. */
  ap: number;
  /** Distribution of the damage dealt per unsaved wound. */
  damageDist: Distribution;
}

/** Stats of the unit being attacked. */
export interface TargetProfile {
  toughness: number;
  baseSave: number;
  /** Optional unmodifiable save. When provided, the best of armor and invulnerable is used. */
  invulnerableSave?: number;
}

export interface CombatResult {
  /** Full probability distribution of total damage dealt in this attack sequence. */
  totalDamageDist: Distribution;
}

/**
 * Executes the full four-stage WH40K combat pipeline and returns the
 * probability distribution of total damage.
 */
export class CalculateCombatResultUseCase {
  execute(input: WeaponProfile & TargetProfile): CombatResult {
    const {
      attacksDist,
      hitThreshold,
      strengthDist,
      ap,
      damageDist,
      toughness,
      baseSave,
      invulnerableSave,
    } = input;

    // ── Stage 1: Attacks → Hits ───────────────────────────────────────────
    // P(hit) = number of faces that meet the threshold / 6.
    // A threshold above 6 means it is impossible to hit.
    const hitProbability = hitThreshold > 6 ? 0 : (7 - hitThreshold) / 6;
    const hitDist = applyStage(attacksDist, hitProbability);

    // ── Stage 2: Hits → Wounds ────────────────────────────────────────────
    // Strength may be a distribution. For each possible strength value s,
    // the wound threshold and the corresponding probability are computed,
    // then weighted by P(S = s) to obtain an effective wound probability:
    //
    //   p_wound = Σ_s  P(S = s) · (7 − woundThreshold(s, T)) / 6
    const woundProbability = strengthDist.reduce((acc, { value: s, probability: pS }) => {
      const threshold = woundThreshold(s, toughness);
      return acc + pS * ((7 - threshold) / 6);
    }, 0);
    const woundDist = applyStage(hitDist, woundProbability);

    // ── Stage 3: Wounds → Unsaved Wounds ─────────────────────────────────
    // effectiveSaveThreshold returns a value that may exceed 6 (save negated).
    // When negated, every wound goes through (failSaveProbability = 1).
    //
    // P(fail save) = (threshold - 1) / 6
    // The faces that fail are 1, 2, ..., threshold-1 (a roll of 1 always fails).
    // This is the inverse of the hit/wound formula because the save is a
    // defender's roll: we want the probability that the defender does NOT succeed.
    // chosenSaveThreshold selects the best available save (armor vs. invulnerable).
    const saveThreshold = chosenSaveThreshold(baseSave, ap, invulnerableSave);
    const failSaveProbability = saveThreshold > 6 ? 1 : (saveThreshold - 1) / 6;
    const unsavedWoundDist = applyStage(woundDist, failSaveProbability);

    // ── Stage 4: Unsaved Wounds → Total Damage ───────────────────────────
    // Each unsaved wound deals `damageDist` damage independently.
    // applyDamage computes the randomly stopped sum.
    const totalDamageDist = applyDamage(unsavedWoundDist, damageDist);

    return { totalDamageDist };
  }
}
