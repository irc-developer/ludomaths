import type { WeaponProfile } from '@domain/dice/weapon';
import type { Distribution } from '@domain/math/distribution';
import { singleAttackDamage } from '@domain/dice/attackDamage';
import type { TargetProfile } from './CalculateCombatResultUseCase';

/** Independent attacks against one miniature; no pre-rolled dice. */
export type RequiredAttacksWeapon = Pick<WeaponProfile,
  'hitThreshold' | 'hitReroll' | 'hitModifier' | 'strengthDist' | 'woundReroll' | 'woundModifier' |
  'ap' | 'damageDist' | 'torrent' | 'sustainedHits' | 'lethalHits' | 'lethalChoice' | 'devastatingWounds' | 'mortalWoundsPerHit'>;
export type RequiredAttacksTarget = Pick<TargetProfile,
  'toughness' | 'baseSave' | 'invulnerableSave' | 'saveModifier' | 'saveReroll' | 'fnpThreshold'>;

export interface RequiredAttacksInput {
  weapon: RequiredAttacksWeapon;
  target: RequiredAttacksTarget;
  /** Remaining wounds of a single miniature, from 1 to 500. */
  targetWounds: number;
  /** Desired elimination probability in (0, 1]. */
  successProbability: number;
  /** Search bound, from 1 to 10,000. Defaults to 10,000. */
  maxAttacks?: number;
  /** Deterministic resource budget; reaching it returns a limit, never an approximation. */
  maxOperations?: number;
}

export interface RequiredAttacksResult {
  status: 'success' | 'impossible' | 'limit';
  /** Minimum on success, search bound on limit, zero on impossible. */
  attacks: number;
  probability: number;
  previousProbability: number;
  reason?: 'zeroDamage' | 'noFiniteGuarantee' | 'complexity';
}


function integer(value: number, min: number, max: number, name: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} debe ser un entero entre ${min} y ${max}.`);
  }
}

function validateDistribution(dist: Distribution, min: number, max: number, name: string): void {
  if (dist.length === 0 || dist.some(entry => !Number.isInteger(entry.value) || entry.value < min || entry.value > max ||
      !Number.isFinite(entry.probability) || entry.probability < 0 || entry.probability > 1) ||
      Math.abs(dist.reduce((sum, entry) => sum + entry.probability, 0) - 1) > 1e-9) {
    throw new RangeError(`${name}: distribución no válida.`);
  }
}

export class CalculateRequiredAttacksUseCase {
  execute(input: RequiredAttacksInput): RequiredAttacksResult {
    const { weapon, target, targetWounds, successProbability, maxAttacks = 10000, maxOperations = 2000000 } = input;
    integer(targetWounds, 1, 500, 'Heridas restantes');
    integer(maxAttacks, 1, 10000, 'Límite de ataques');
    integer(maxOperations, 1, 10000000, 'Límite de operaciones');
    if (!Number.isFinite(successProbability) || successProbability <= 0 || successProbability > 1) {
      throw new RangeError('La fiabilidad debe ser mayor que 0% y como máximo 100%.');
    }
    integer(weapon.hitThreshold, 2, 6, 'Impactar');
    integer(weapon.ap, 0, 100, 'FP');
    integer(weapon.sustainedHits ?? 0, 0, 10, 'Impactos sostenidos');
    integer(weapon.mortalWoundsPerHit ?? 0, 0, 100, 'Mortales por impacto');
    integer(target.toughness, 1, 100, 'Resistencia');
    integer(target.baseSave, 2, 6, 'Salvación');
    if (target.invulnerableSave !== undefined) integer(target.invulnerableSave, 2, 6, 'Invulnerable');
    if (target.fnpThreshold !== undefined) integer(target.fnpThreshold, 2, 6, 'No hay dolor');
    validateDistribution(weapon.strengthDist, 1, 100, 'Fuerza');
    validateDistribution(weapon.damageDist, 0, 100, 'Daño');

    const dist = singleAttackDamage(weapon, target);
    if (!dist.some(entry => entry.value > 0)) {
      return { status: 'impossible', attacks: 0, probability: 0, previousProbability: 0, reason: 'zeroDamage' };
    }
    if (successProbability === 1 && dist[0].value === 0) {
      return { status: 'impossible', attacks: 0, probability: 0, previousProbability: 0, reason: 'noFiniteGuarantee' };
    }

    // P(S_n = d) = sum_x P(S_(n-1) = d-x) P(D=x).
    // Only d < W needs storage: reaching W is absorbing. Memory stays O(W),
    // rather than growing with total possible damage or the number of attacks.
    let surviving = new Float64Array(targetWounds);
    surviving[0] = 1;
    let probability = 0;
    let previousProbability = 0;
    let operations = 0;
    for (let attacks = 1; attacks <= maxAttacks; attacks++) {
      const stepOperations = surviving.reduce((sum, mass) => sum + (mass > 0 ? dist.length : 0), 0);
      if (operations + stepOperations > maxOperations) return { status: 'limit', attacks: attacks - 1,
        probability, previousProbability, reason: 'complexity' };
      operations += stepOperations;
      const next = new Float64Array(targetWounds);
      previousProbability = probability;
      for (let wounds = 0; wounds < targetWounds; wounds++) {
        if (surviving[wounds] === 0) continue;
        for (const entry of dist) {
          const mass = surviving[wounds] * entry.probability;
          if (wounds + entry.value >= targetWounds) probability += mass;
          else next[wounds + entry.value] += mass;
        }
      }
      surviving = next;
      probability = Math.min(1, probability);
      // Use support, not rounding, to establish mathematical certainty.
      if (dist[0].value * attacks >= targetWounds) probability = 1;
      if (probability >= successProbability) {
        return { status: 'success', attacks, probability, previousProbability };
      }
    }
    return { status: 'limit', attacks: maxAttacks, probability, previousProbability };
  }
}
