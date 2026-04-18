/**
 * @module combatRecord
 *
 * Domain type that represents a saved WH40K combat calculation.
 *
 * Stores snapshots of the attacker and defender profiles at the moment the
 * calculation was performed, not the result. The result is deterministic and
 * cheap to recompute, so re-running the use case on load is preferable to
 * caching a value that could become stale after a formula fix.
 */

import { UnitProfile } from '@domain/profiles/unitProfile';

export interface CombatRecord {
  /**
   * User-defined label for this record (e.g. "Intercessors vs Guardia Imperial").
   * Must be a non-empty string after trimming.
   */
  label: string;

  /**
   * Snapshot of the attacking unit at the time the calculation was saved.
   * Stored independently of the profile list so edits to a profile do not
   * alter historical records.
   */
  attacker: UnitProfile;

  /**
   * Snapshot of the defending unit at the time the calculation was saved.
   */
  defender: UnitProfile;
}

/**
 * Validates the invariants of a CombatRecord and throws a RangeError if any
 * rule is violated.
 *
 * - label must be a non-empty string after trimming.
 * - attacker and defender must each satisfy UnitProfile invariants.
 * - attacker must have at least one weapon group (a record with no attacker
 *   weapons can never deal damage and is meaningless to store).
 *
 * @throws {RangeError} on the first invariant violation found.
 */
import { validateUnitProfile } from '@domain/profiles/unitProfile';

export function validateCombatRecord(record: CombatRecord): void {
  if (!record.label.trim()) {
    throw new RangeError('CombatRecord: label must not be empty');
  }
  validateUnitProfile(record.attacker);
  validateUnitProfile(record.defender);
  if (record.attacker.weaponGroups.length === 0) {
    throw new RangeError('CombatRecord: attacker must have at least one weapon group');
  }
}
