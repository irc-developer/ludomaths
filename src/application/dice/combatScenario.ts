import type { CatalogSelection } from './catalogScenario';
import { characteristicDistribution } from '@domain/dice/characteristic';
import type { WeaponGroup } from '@domain/dice/weapon';
import type { AttackTarget } from '@domain/dice/attackDamage';
export { COMBAT_ENGINE_VERSION } from '@domain/combat/calculationVersion';
export interface CombatScenarioInput {
  targetModelCount?: number;
  primaryExtraWeapons?: CombatScenarioInput[];
  attackerEquipmentGroups?: Array<{ id: string; count: number; weapons: CombatScenarioInput[] }>;
  defenderGroups?: Array<{ id: string; count: number; profile: CombatScenarioInput; isCharacter?: boolean }>;
  primaryIsCharacter?: boolean;
  casualtyGoal?: number;
  requiredSquadUnit?: 'attacks' | 'models' | 'activations';
  acceptedSquadOmissions?: string[];
  catalogSelection?: CatalogSelection;
  partialCalculation?: boolean;
  calculationBlocked?: boolean;
  calculationLimitations?: string[];
  attacks:      number;
  attacksExpression?: string;
  damageExpression?: string;
  modelCount?: number;
  woundsMax?: number;
  attackType?: 'ranged' | 'melee';
  hitModifier?: number;
  woundModifier?: number;
  saveModifier?: number;
  lethalChoice?: 'autoWound' | 'rollToWound';
  cover?: boolean;
  ignoresCover?: boolean;
  heavy?: boolean;
  rapidFire?: number;
  melta?: number;
  twinLinked?: boolean;
  withinHalfRange?: boolean;
  phase?: 'shooting' | 'fight';
  engaged?: boolean;
  setUpThisTurn?: boolean;
  movedOverThree?: boolean;

  attacksD6?:   boolean;
  hitThreshold: number;

  hitRerollAll?: boolean;

  hitRerollNonSixes?: boolean;

  guaranteedHitSix?: boolean;
  strength:     number;

  woundRerollAll?: boolean;

  woundRerollNonSixes?: boolean;

  guaranteedWoundSix?: boolean;
  ap:           number;

  damage:       number;

  damageD6?:    boolean;

  guaranteedDamageSix?: boolean;

  damageBonus?: number;

  torrent?:     boolean;
  toughness:    number;

  targetWounds: number;
  baseSave:     number;
  invulnerableSave?: number;
  fnpThreshold?:     number;

  guaranteedSaveSix?: boolean;
  sustainedHits?:    number;
  lethalHits?:       boolean;
  devastatingWounds?: boolean;
  mortalWoundsPerHit?: number;
}

function integer(value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError('Invalid combat characteristic');
}
export function buildCombatScenario(input: CombatScenarioInput): { weapon: WeaponGroup; target: AttackTarget; woundsMax: number; remainingWounds: number } {
  if (input.calculationBlocked) throw new RangeError('CATALOG_RULES_PENDING');
  const ranged = input.attackType !== 'melee';
  const modelCount = input.modelCount ?? 1;
  const woundsMax = input.woundsMax ?? input.targetWounds;
  integer(modelCount, 1, 100);
  integer(input.targetWounds, 1, 500);
  integer(woundsMax, input.targetWounds, 500);
  integer(input.strength, 1, 100);
  integer(input.toughness, 1, 100);
  integer(input.hitThreshold, 2, 6);
  integer(input.baseSave, 2, 6);
  integer(input.ap, 0, 100);
  integer(input.sustainedHits ?? 0, 0, 10);
  integer(input.mortalWoundsPerHit ?? 0, 0, 100);
  for (const value of [input.invulnerableSave, input.fnpThreshold]) if (value !== undefined) integer(value, 2, 6);
  for (const value of [input.hitModifier ?? 0, input.woundModifier ?? 0, input.saveModifier ?? 0]) integer(value, -100, 100);
  for (const value of [input.rapidFire ?? 0, input.melta ?? 0, input.damageBonus ?? 0]) integer(value, 0, 100);
  const requiresRange = ranged && ((input.rapidFire ?? 0) > 0 || (input.melta ?? 0) > 0);
  if (requiresRange && input.withinHalfRange === undefined) throw new RangeError('Half-range context is required');
  if (input.heavy && ranged && [input.phase, input.engaged, input.setUpThisTurn, input.movedOverThree].some(value => value === undefined)) {
    throw new RangeError('Heavy requires phase, engagement, arrival and movement context');
  }
  const heavyActive = input.heavy && ranged && input.phase === 'shooting' && !input.engaged && !input.setUpThisTurn && !input.movedOverThree;
  const attacksDist = characteristicDistribution(input.attacksExpression ?? (input.attacksD6 ? 'D6' : String(input.attacks)))
    .map(entry => ({ ...entry, value: entry.value + (ranged && input.withinHalfRange ? input.rapidFire ?? 0 : 0) }));
  const damageDist = characteristicDistribution(input.damageExpression ?? (input.damageD6 ? 'D6' : String(input.damage)))
    .map(entry => ({ ...entry, value: entry.value + (input.damageBonus ?? 0) + (ranged && input.withinHalfRange ? input.melta ?? 0 : 0) }));
  if (attacksDist.some(e => e.value < 1 || e.value > 100) || damageDist.some(e => e.value < 1 || e.value > 100)) throw new RangeError('Characteristic support limit exceeded');
  const maxAttacks = Math.max(...attacksDist.map(e => e.value)) * modelCount;
  const maxDamage = Math.max(...damageDist.map(e => e.value)) * (1 + (input.sustainedHits ?? 0)) + (input.mortalWoundsPerHit ?? 0);
  // Bound the joint support and convolution cost before allocating distributions.
  if (maxAttacks * maxDamage > 2000 || maxAttacks * maxAttacks * maxDamage * Math.min(maxDamage + 1, 101) > 2000000) {
    throw new RangeError('Calculation complexity limit exceeded; reduce carriers or characteristics');
  }
  const hitReroll = input.torrent ? 'none' : input.hitRerollNonSixes ? 'nonSixes' : input.hitRerollAll ? 'failures' : 'none';
  const woundReroll = input.woundRerollNonSixes ? 'nonSixes' : input.woundRerollAll ? 'failures' : 'none';
  const weapon: WeaponGroup = { attacksDist, modelCount,
    hitThreshold: Math.min(6, input.hitThreshold + (ranged && input.cover && !input.ignoresCover ? 1 : 0)),
    hitModifier: (input.hitModifier ?? 0) + (heavyActive ? 1 : 0), hitReroll,
    strengthDist: [{ value: input.strength, probability: 1 }], woundReroll,
    woundModifier: input.woundModifier, ap: input.ap, damageDist,
    sustainedHits: input.sustainedHits, lethalHits: input.lethalHits, lethalChoice: input.lethalChoice,
    devastatingWounds: input.devastatingWounds, mortalWoundsPerHit: input.mortalWoundsPerHit, torrent: input.torrent,
    guaranteedHitSixes: input.guaranteedHitSix ? 1 : undefined,
    guaranteedWoundSixes: input.guaranteedWoundSix ? 1 : undefined,
    guaranteedDamageValue: input.damageD6 && input.guaranteedDamageSix ? 6 + (input.damageBonus ?? 0) : undefined,
  };
  const target: AttackTarget = { toughness: input.toughness, baseSave: input.baseSave,
    invulnerableSave: input.invulnerableSave, fnpThreshold: input.fnpThreshold, saveModifier: input.saveModifier };
  return { weapon, target, woundsMax, remainingWounds: input.targetWounds };
}
