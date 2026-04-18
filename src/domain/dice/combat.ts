/**
 * @module combat
 *
 * Game-specific rules for Warhammer 40K dice rolls.
 *
 * These functions encode the wound and save tables of the game rules.
 * They know about game concepts (strength, toughness, armor penetration)
 * and translate them into numeric thresholds used by the math layer.
 *
 * This module belongs in domain/dice because it contains game knowledge.
 * It imports nothing from domain/math — it only returns numbers that the
 * math layer can consume.
 */

/**
 * Returns the minimum D6 roll required to wound, given the attacker's
 * Strength (S) and the defender's Toughness (T).
 *
 * Warhammer 40K wound table:
 *
 *   S ≥ 2T  → 2+
 *   S >  T  → 3+
 *   S === T → 4+
 *   S <  T  → 5+
 *   S*2 ≤ T → 6+   (equivalently: S ≤ T/2)
 *
 * @param strength  - Attacker's Strength. Must be a positive integer.
 * @param toughness - Defender's Toughness. Must be a positive integer.
 * @returns The minimum die result needed to wound (2, 3, 4, 5, or 6).
 *
 * @throws {RangeError} If strength or toughness are not positive integers.
 *
 * @example
 * woundThreshold(4, 4) // → 4  (S equals T, wound on 4+)
 * woundThreshold(8, 4) // → 2  (S is double T, wound on 2+)
 * woundThreshold(2, 4) // → 6  (S is half T, wound on 6+ only)
 */
export function woundThreshold(strength: number, toughness: number): 2 | 3 | 4 | 5 | 6 {
  if (!Number.isInteger(strength) || strength <= 0) {
    throw new RangeError(
      `woundThreshold: strength must be a positive integer, got ${strength}`,
    );
  }
  if (!Number.isInteger(toughness) || toughness <= 0) {
    throw new RangeError(
      `woundThreshold: toughness must be a positive integer, got ${toughness}`,
    );
  }

  if (strength * 2 <= toughness)  return 6;
  if (strength < toughness)       return 5;
  if (strength === toughness)     return 4;
  if (strength < toughness * 2)   return 3; // strength > toughness but < 2×toughness
  return 2; // strength >= 2 × toughness
}

/**
 * Returns the effective save threshold after applying Armor Penetration (AP).
 *
 *   effectiveSave = baseSave + ap
 *
 * A result > 6 means the save is impossible (no die roll can succeed).
 * The caller is responsible for interpreting values above 6 (e.g., treating
 * fail probability as 1).
 *
 * @param baseSave - The unit's unmodified save value. Must be an integer in [2, 6].
 * @param ap       - Armor Penetration. A non-negative integer. AP-1 is passed as 1.
 * @returns The effective threshold. May exceed 6 if AP negates the save entirely.
 *
 * @throws {RangeError} If baseSave is not an integer in [2, 6], or ap is not
 *   a non-negative integer.
 *
 * @example
 * effectiveSaveThreshold(3, 1)  // → 4  (3+ save against AP-1 becomes 4+)
 * effectiveSaveThreshold(5, 3)  // → 8  (save impossible; no roll can succeed)
 */
export function effectiveSaveThreshold(baseSave: number, ap: number): number {
  if (!Number.isInteger(baseSave) || baseSave < 2 || baseSave > 6) {
    throw new RangeError(
      `effectiveSaveThreshold: baseSave must be an integer in [2, 6], got ${baseSave}`,
    );
  }
  if (!Number.isInteger(ap) || ap < 0) {
    throw new RangeError(
      `effectiveSaveThreshold: ap must be a non-negative integer, got ${ap}`,
    );
  }

  return baseSave + ap;
}

/**
 * Returns the threshold the defender actually uses, choosing between the
 * armor save (modified by AP) and an optional unmodifiable invulnerable save.
 *
 * The invulnerable save is never affected by AP or any other modifier.
 * The defender always benefits from whichever threshold is lower (easier to roll).
 *
 *   chosen = min(effectiveSaveThreshold(baseSave, ap), invulnerableSave)
 *
 * If no invulnerable save is provided, the result equals effectiveSaveThreshold.
 *
 * @param baseSave         - The unit's armor save before modifiers. Integer in [2, 6].
 * @param ap               - Armor Penetration. Non-negative integer.
 * @param invulnerableSave - Optional unmodifiable save. Integer in [2, 6] if provided.
 * @returns The threshold to use. May exceed 6 only when armor is negated and no
 *   invulnerable save is provided.
 *
 * @throws {RangeError} If invulnerableSave is provided but outside [2, 6] or
 *   not an integer. Also propagates errors from effectiveSaveThreshold.
 *
 * @example
 * chosenSaveThreshold(4, 2, 5)  // → 5  (armor becomes 6+, invulnerable 5+ wins)
 * chosenSaveThreshold(2, 0, 5)  // → 2  (armor 2+ beats invulnerable 5+)
 * chosenSaveThreshold(5, 3, 4)  // → 4  (armor negated, invulnerable 4+ takes over)
 */
export function chosenSaveThreshold(
  baseSave: number,
  ap: number,
  invulnerableSave?: number,
): number {
  const armorThreshold = effectiveSaveThreshold(baseSave, ap);

  if (invulnerableSave === undefined) {
    return armorThreshold;
  }

  if (!Number.isInteger(invulnerableSave) || invulnerableSave < 2 || invulnerableSave > 6) {
    throw new RangeError(
      `chosenSaveThreshold: invulnerableSave must be an integer in [2, 6], got ${invulnerableSave}`,
    );
  }

  return Math.min(armorThreshold, invulnerableSave);
}
