/**
 * @module CalculateCombatResultUseCase
 *
 * Facade for single-weapon, single-save WH40K combat.
 *
 * Delegates to CalculateUnitCombatUseCase with modelCount=1 and a single
 * save pool of fraction=1. This eliminates pipeline duplication while
 * preserving the simpler API for common single-weapon scenarios.
 */

import { DieRerollPolicy } from '@domain/dice/combat';
import { WeaponProfile } from '@domain/dice/weapon';
import { Distribution } from '@domain/math/distribution';
import { CalculateUnitCombatUseCase } from './CalculateUnitCombatUseCase';

/** Stats of the unit being attacked. */
export interface TargetProfile {
  toughness: number;
  baseSave: number;
  /** Optional unmodifiable save. When provided, the best of armor and invulnerable is used. */
  invulnerableSave?: number;
  /** Optional modifier applied to save rolls. Clamped to [−1, +1]. Defaults to 0. */
  saveModifier?: number;
  /** Optional re-roll policy for save rolls. Defaults to 'none'. */
  saveReroll?: DieRerollPolicy;
  /**
   * Optional Feel No Pain threshold. Each point of damage is independently
   * negated on a D6 roll ≥ fnpThreshold.
   */
  fnpThreshold?: number;  /**
   * Number of save dice pre-rolled as a natural 6 (auto-save regardless of AP).
   * Each guaranteed save removes one wound before the normal save rolls.
   * Defaults to 0.
   */
  guaranteedSaves?: number;}

export interface CombatResult {
  /** Full probability distribution of total damage dealt in this attack sequence. */
  totalDamageDist: Distribution;
}

/**
 * Single-weapon, single-save facade over CalculateUnitCombatUseCase.
 *
 * Wraps the input into the unit use case format:
 * - modelCount: 1 (one weapon contributing attacks)
 * - savePools: one pool with fraction=1 (whole unit shares the same save)
 */
export class CalculateCombatResultUseCase {
  private readonly unitCase = new CalculateUnitCombatUseCase();

  execute(input: WeaponProfile & TargetProfile): CombatResult {
    const {
      attacksDist,
      hitThreshold,
      hitModifier,
      hitReroll,
      guaranteedHitSixes,
      strengthDist,
      woundModifier,
      woundReroll,
      guaranteedWoundSixes,
      ap,
      damageDist,
      guaranteedDamageValue,
      sustainedHits,
      lethalHits,
      devastatingWounds,
      mortalWoundsPerHit,
      torrent,
      toughness,
      baseSave,
      invulnerableSave,
      saveModifier,
      saveReroll,
      fnpThreshold,
      guaranteedSaves,
    } = input;

    return this.unitCase.execute({
      weaponGroups: [{
        attacksDist, hitThreshold, hitModifier, hitReroll, guaranteedHitSixes,
        strengthDist, woundModifier, woundReroll, guaranteedWoundSixes,
        ap, damageDist, guaranteedDamageValue, modelCount: 1,
        sustainedHits, lethalHits, devastatingWounds, mortalWoundsPerHit, torrent,
      }],
      toughness,
      savePools: [{ baseSave, fraction: 1, invulnerableSave, saveModifier, saveReroll, fnpThreshold, guaranteedSaves }],
    });
  }
}
