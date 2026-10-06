import type { WeaponProfile } from '@domain/dice/weapon';
import type { Distribution } from '@domain/math/distribution';
import { combatRollProbabilities, dieSuccessProbability, chosenSaveThreshold, woundThreshold } from '@domain/dice/combat';
import { convolve, multiConvolve } from '@domain/math/convolution';
import { applyStage } from '@domain/math/pipeline';
import type { TargetProfile } from './CalculateCombatResultUseCase';

/** Independent attacks against one miniature; no pre-rolled dice. */
export type RequiredAttacksWeapon = Pick<WeaponProfile,
  'hitThreshold' | 'hitReroll' | 'hitModifier' | 'strengthDist' | 'woundReroll' | 'woundModifier' |
  'ap' | 'damageDist' | 'torrent' | 'sustainedHits' | 'lethalHits' | 'devastatingWounds' | 'mortalWoundsPerHit'>;
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
}

export interface RequiredAttacksResult {
  status: 'success' | 'impossible' | 'limit';
  /** Minimum on success, search bound on limit, zero on impossible. */
  attacks: number;
  probability: number;
  previousProbability: number;
  reason?: 'zeroDamage' | 'noFiniteGuarantee';
}

const ZERO: Distribution = [{ value: 0, probability: 1 }];

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

/** Mixture of mutually exclusive branches, not a sum of independent rolls. */
function mixture(branches: Array<{ probability: number; dist: Distribution }>): Distribution {
  const values = new Map<number, number>();
  for (const branch of branches) {
    for (const entry of branch.dist) {
      values.set(entry.value, (values.get(entry.value) ?? 0) + branch.probability * entry.probability);
    }
  }
  const total = Array.from(values.values()).reduce((sum, probability) => sum + probability, 0);
  return Array.from(values, ([value, probability]) => ({ value, probability: probability / total }))
    .filter(entry => entry.probability > 0).sort((a, b) => a.value - b.value);
}

/**
 * Conditions on the hit result so a critical hit and its sustained hits stay
 * correlated. Lethal originals still take saves; sustained extras roll to wound.
 */
function singleAttackDamage(weapon: RequiredAttacksWeapon, target: RequiredAttacksTarget): Distribution {
  const hit = combatRollProbabilities(weapon.hitThreshold, weapon.hitModifier, weapon.hitReroll);
  const wound = weapon.strengthDist.reduce((sum, entry) => {
    const roll = combatRollProbabilities(woundThreshold(entry.value, target.toughness), weapon.woundModifier, weapon.woundReroll);
    return { success: sum.success + entry.probability * roll.success, critical: sum.critical + entry.probability * roll.critical };
  }, { success: 0, critical: 0 });
  // Invulnerable saves ignore modifiers; compare the actual armor and invulnerable probabilities.
  const armor = dieSuccessProbability(chosenSaveThreshold(target.baseSave, weapon.ap), target.saveModifier, target.saveReroll);
  const invulnerable = target.invulnerableSave === undefined ? 0 :
    dieSuccessProbability(target.invulnerableSave, 0, target.saveReroll);
  const failSave = 1 - Math.max(armor, invulnerable);
  const damage = target.fnpThreshold === undefined ? weapon.damageDist :
    applyStage(weapon.damageDist, 1 - dieSuccessProbability(target.fnpThreshold));
  const mortals: Distribution = [{ value: weapon.mortalWoundsPerHit ?? 0, probability: 1 }];
  const mortalDamage = target.fnpThreshold === undefined ? mortals :
    applyStage(mortals, 1 - dieSuccessProbability(target.fnpThreshold));
  const damagingHit = (probability: number) => convolve(mixture([
    { probability, dist: damage }, { probability: 1 - probability, dist: ZERO },
  ]), mortalDamage);
  const pUnsaved = weapon.devastatingWounds
    ? wound.critical + (wound.success - wound.critical) * failSave
    : wound.success * failSave;
  const normalHitDamage = damagingHit(pUnsaved);
  if (weapon.torrent) return normalHitDamage;

  const criticalOriginal = weapon.lethalHits ? damagingHit(failSave) : normalHitDamage;
  const criticalDamage = convolve(criticalOriginal, multiConvolve(normalHitDamage, weapon.sustainedHits ?? 0));
  return mixture([
    { probability: 1 - hit.success, dist: ZERO },
    { probability: hit.normal, dist: normalHitDamage },
    { probability: hit.critical, dist: criticalDamage },
  ]);
}

export class CalculateRequiredAttacksUseCase {
  execute(input: RequiredAttacksInput): RequiredAttacksResult {
    const { weapon, target, targetWounds, successProbability, maxAttacks = 10000 } = input;
    integer(targetWounds, 1, 500, 'Heridas restantes');
    integer(maxAttacks, 1, 10000, 'Límite de ataques');
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
    for (let attacks = 1; attacks <= maxAttacks; attacks++) {
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
