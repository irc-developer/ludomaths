/**
 * @module unitProfile
 *
 * Domain type that represents a complete WH40K unit for combat calculations.
 *
 * A UnitProfile captures everything needed to use the unit both as attacker
 * (weapon groups) and as defender (wounds, toughness, save pools). This makes
 * it the natural input for use cases like "rounds to kill" that need both sides.
 *
 * The type intentionally has no id, createdAt or any persistence metadata.
 * Those belong to infrastructure. Domain only models what the game knows about
 * a unit, not how the app stores it.
 */

import { WeaponGroup } from '@domain/dice/weapon';
import { SavePool } from '@domain/dice/savePool';

export interface UnitProfile {
  /** Display name of the unit (e.g. "Intercessors", "Leman Russ"). */
  name: string;

  // ── Offensive stats ──────────────────────────────────────────────────────

  /**
   * One entry per distinct weapon carried by models in this unit.
   * Each group specifies how many models carry that weapon (modelCount).
   * A unit with no ranged weapons has an empty array.
   */
  weaponGroups: WeaponGroup[];

  // ── Defensive stats ──────────────────────────────────────────────────────

  /** Total wounds of the unit across all models (e.g. 10 marines × 2W = 20). */
  wounds: number;

  /** Toughness value. Assumed uniform across the unit. */
  toughness: number;

  /**
   * One entry per group of models that share the same save characteristics.
   * For homogeneous units, a single pool with fraction=1 is sufficient.
   * All fractions must sum to 1.
   */
  savePools: SavePool[];
}
