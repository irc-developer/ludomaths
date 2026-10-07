import type { WeaponProfile } from './weapon';
import type { SavePool } from './savePool';
import type { Distribution } from '../math/distribution';
import { combatRollProbabilities, dieSuccessProbability, saveSuccessProbability, chosenSaveThreshold, woundThreshold } from './combat';
import { convolve, multiConvolve } from '../math/convolution';
import { applyStage } from '../math/pipeline';
export type AttackWeapon = Pick<WeaponProfile,
  'hitThreshold' | 'hitReroll' | 'hitModifier' | 'strengthDist' | 'woundReroll' | 'woundModifier' |
  'ap' | 'damageDist' | 'torrent' | 'sustainedHits' | 'lethalHits' | 'lethalChoice' | 'devastatingWounds' | 'mortalWoundsPerHit'>;
export type AttackTarget = Pick<SavePool, 'baseSave' | 'invulnerableSave' | 'saveModifier' | 'saveReroll' | 'fnpThreshold'> & { toughness: number };
const ZERO: Distribution = [{ value: 0, probability: 1 }];
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
export function attackRollProbabilities(weapon: AttackWeapon, toughness: number) {
  const hit = combatRollProbabilities(weapon.hitThreshold, weapon.hitModifier, weapon.hitReroll);
  const wound = weapon.strengthDist.reduce((sum, entry) => {
    const roll = combatRollProbabilities(woundThreshold(entry.value, toughness), weapon.woundModifier, weapon.woundReroll);
    return { success: sum.success + entry.probability * roll.success, critical: sum.critical + entry.probability * roll.critical };
  }, { success: 0, critical: 0 });
  return { hit, wound };
}

export function singleAttackDamage(weapon: AttackWeapon, target: AttackTarget): Distribution {
  const { hit, wound } = attackRollProbabilities(weapon, target.toughness);
  // Invulnerable saves ignore modifiers; compare the actual armor and invulnerable probabilities.
  const armor = saveSuccessProbability(chosenSaveThreshold(target.baseSave, weapon.ap), target.saveModifier, target.saveReroll);
  const invulnerable = target.invulnerableSave === undefined ? 0 :
    saveSuccessProbability(target.invulnerableSave, 0, target.saveReroll);
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

  const criticalOriginal = weapon.lethalHits && weapon.lethalChoice !== 'rollToWound' ? damagingHit(failSave) : normalHitDamage;
  const criticalDamage = convolve(criticalOriginal, multiConvolve(normalHitDamage, weapon.sustainedHits ?? 0));
  return mixture([
    { probability: 1 - hit.success, dist: ZERO },
    { probability: hit.normal, dist: normalHitDamage },
    { probability: hit.critical, dist: criticalDamage },
  ]);
}
