/**
 * @module weapon
 *
 * Domain types for weapon profiles used in dice-roll combat calculations.
 *
 * Lives in domain/dice because it encodes game concepts (attacks, strength,
 * armor penetration) that drive the combat pipeline. It has no knowledge of
 * use cases or infrastructure.
 */

import { DieRerollPolicy } from './combat';
import { Distribution } from '@domain/math/distribution';

/**
 * Input profile for a weapon.
 *
 * All numeric stats that vary per roll (attacks, strength, damage) are
 * expressed as `Distribution` so both fixed and variable dice are supported
 * transparently:
 * - Fixed value n → `[{ value: n, probability: 1 }]`
 * - Variable dice (e.g. D6) → full distribution with 6 equal entries
 */
export interface WeaponProfile {
  /** Distribution of the number of attacks. */
  attacksDist: Distribution;
  /** Minimum D6 result needed to hit (e.g. 3 means "3+"). */
  hitThreshold: number;
  /** Distribution of the weapon's Strength. */
  strengthDist: Distribution;
  /** Armor Penetration value. A non-negative integer. AP-1 is passed as 1. */
  ap: number;
  /** Distribution of the damage dealt per unsaved wound. */
  damageDist: Distribution;
  /** Optional modifier applied to hit rolls. Clamped to [−1, +1]. Defaults to 0. */
  hitModifier?: number;
  /** Optional re-roll policy for hit rolls. Defaults to 'none'. */
  hitReroll?: DieRerollPolicy;
  /** Optional modifier applied to wound rolls. Clamped to [−1, +1]. Defaults to 0. */
  woundModifier?: number;
  /** Optional re-roll policy for wound rolls. Defaults to 'none'. */
  woundReroll?: DieRerollPolicy;
}

/**
 * A weapon profile assigned to a group of identical models within a unit.
 *
 * Extends WeaponProfile with `modelCount` so the pipeline can inflate the
 * attacks distribution (multiConvolve) before entering Stage 1.
 */
export interface WeaponGroup extends WeaponProfile {
  /** Number of models carrying this weapon. Must be a non-negative integer. */
  modelCount: number;
}
