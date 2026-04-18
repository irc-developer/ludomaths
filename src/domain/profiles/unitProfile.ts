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

/**
 * Validates the invariants of a UnitProfile and throws a RangeError if any
 * rule is violated.
 *
 * Invariants:
 * - name must be a non-empty string after trimming whitespace.
 * - wounds must be a positive integer (≥ 1).
 * - toughness must be a positive integer (≥ 1).
 * - savePools must be non-empty.
 * - savePool fractions must sum to 1 (within floating-point tolerance).
 *
 * weaponGroups may be empty — a unit used only as a combat target has no weapons.
 *
 * @throws {RangeError} on the first invariant violation found.
 */
export function validateUnitProfile(profile: UnitProfile): void {
  if (!profile.name.trim()) {
    throw new RangeError('UnitProfile: name must not be empty');
  }
  if (!Number.isInteger(profile.wounds) || profile.wounds < 1) {
    throw new RangeError(
      `UnitProfile: wounds must be a positive integer, got ${profile.wounds}`,
    );
  }
  if (!Number.isInteger(profile.toughness) || profile.toughness < 1) {
    throw new RangeError(
      `UnitProfile: toughness must be a positive integer, got ${profile.toughness}`,
    );
  }
  if (profile.savePools.length === 0) {
    throw new RangeError('UnitProfile: savePools must not be empty');
  }
  const fractionSum = profile.savePools.reduce((acc, p) => acc + p.fraction, 0);
  if (Math.abs(fractionSum - 1) > 1e-9) {
    throw new RangeError(
      `UnitProfile: savePool fractions must sum to 1, got ${fractionSum}`,
    );
  }
}
