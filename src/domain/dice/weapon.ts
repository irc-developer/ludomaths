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
  /** Number of hit dice that are pre-rolled as a natural 6. Defaults to 0. */
  guaranteedHitSixes?: number;
  /** Optional modifier applied to wound rolls. Clamped to [−1, +1]. Defaults to 0. */
  woundModifier?: number;
  /** Optional re-roll policy for wound rolls. Defaults to 'none'. */
  woundReroll?: DieRerollPolicy;
  /** Number of wound dice that are pre-rolled as a natural 6. Defaults to 0. */
  guaranteedWoundSixes?: number;
  /**
   * Fixed damage value already showing on one damage die.
   * Applied once when at least one wound reaches the damage step.
   */
  guaranteedDamageValue?: number;

  // ── Special weapon abilities ─────────────────────────────────────────────

  /**
   * [SUSTAINED HITS X]: each unmodified hit roll of 6 (critical hit) generates
   * X additional hits that are resolved as normal hits (no further crits).
   * Must be a positive integer when provided.
   */
  sustainedHits?: number;

  /**
   * [LETHAL HITS]: each unmodified hit roll of 6 (critical hit) automatically
   * wounds the target — the wound roll is skipped for that hit. The auto-wound
   * then goes through saves as normal.
   */
  lethalHits?: boolean;

  /**
   * [DEVASTATING WOUNDS]: each unmodified wound roll of 6 (critical wound) bypasses
   * all saves (armor and invulnerable). The critical wound deals its damage as
   * mortal wounds. Feel No Pain still applies (10th edition rule).
   */
  devastatingWounds?: boolean;

  /**
   * Mortal wounds per hit: each hit (including critical hits counted as hits)
   * additionally inflicts this many mortal wounds that bypass saves.
   * Feel No Pain applies normally.
   * Must be a positive integer when provided.
   */
  mortalWoundsPerHit?: number;

  /**
   * [TORRENT]: the weapon auto-hits — no hit roll is made.
   * All attacks automatically become hits, so Stage 1 of the pipeline is skipped.
   * Abilities that require a hit roll (Sustained Hits, Lethal Hits) cannot trigger.
   * Wound rolls, saves and FNP proceed as normal.
   * Typical weapons: flamers, torrent weapons (10th edition rule).
   */
  torrent?: boolean;
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
