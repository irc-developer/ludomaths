import { buildCombatScenario, type CombatScenarioInput } from './combatScenario';
import type { SquadCombatInput, SquadDefenderGroup } from './CalculateSquadCombatUseCase';

/** A reusable individual profile must not contain the enclosing squad session. */
export function individualProfile(input: CombatScenarioInput): CombatScenarioInput {
  const { targetModelCount: _target, primaryExtraWeapons: _weapons, attackerEquipmentGroups: _attacker,
    defenderGroups: _defender, primaryIsCharacter: _character, casualtyGoal: _goal, requiredSquadUnit: _unit, acceptedSquadOmissions: _accepted, ...profile } = input;
  return { ...profile, modelCount: 1 };
}
export function isSquadScenario(input: CombatScenarioInput): boolean {
  return (input.targetModelCount ?? 1) > 1 || !!input.attackerEquipmentGroups?.length ||
    !!input.primaryExtraWeapons?.length || !!input.defenderGroups?.length || !!input.primaryIsCharacter;
}

/** Move a profile without replacing the enclosing counts, opposite side or groups. */
export function replacePrimaryProfile(base: CombatScenarioInput, profile: CombatScenarioInput, side: 'attacker' | 'defender'): CombatScenarioInput {
  const keys: Array<keyof CombatScenarioInput> = side === 'attacker'
    ? ['attacks', 'attacksExpression', 'attacksD6', 'damage', 'damageExpression', 'damageD6', 'hitThreshold', 'strength', 'ap',
      'hitModifier', 'woundModifier', 'hitRerollAll', 'hitRerollNonSixes', 'woundRerollAll', 'woundRerollNonSixes', 'damageBonus',
      'torrent', 'lethalHits', 'lethalChoice', 'sustainedHits', 'devastatingWounds', 'ignoresCover', 'heavy', 'rapidFire', 'melta',
      'twinLinked', 'withinHalfRange', 'phase', 'engaged', 'setUpThisTurn', 'movedOverThree', 'guaranteedHitSix', 'guaranteedWoundSix',
      'guaranteedDamageSix', 'mortalWoundsPerHit']
    : ['toughness', 'woundsMax', 'targetWounds', 'baseSave', 'invulnerableSave', 'fnpThreshold', 'saveModifier', 'guaranteedSaveSix'];
  const result = { ...base, ...Object.fromEntries(keys.map(key => [key, profile[key]])) };
  if (base.catalogSelection && profile.catalogSelection) result.catalogSelection = { ...base.catalogSelection,
    ...(side === 'attacker' ? { attackerMiniatureId: profile.catalogSelection.attackerMiniatureId, modeId: profile.catalogSelection.modeId }
      : { defenderMiniatureId: profile.catalogSelection.defenderMiniatureId }) };
  return result;
}

export function buildSquadScenario(input: CombatScenarioInput): SquadCombatInput {
  const attackerTotal = input.modelCount ?? 1;
  const defenderTotal = input.targetModelCount ?? 1;
  const extraAttacker = input.attackerEquipmentGroups ?? [];
  const extraDefender = input.defenderGroups ?? [];
  const validCount = (n: number) => { if (!Number.isInteger(n) || n < 1 || n > 100) throw new RangeError('SQUAD_INVALID_INPUT'); };
  validCount(attackerTotal); validCount(defenderTotal);
  for (const g of [...extraAttacker, ...extraDefender]) validCount(g.count);
  const primaryAttackers = attackerTotal - extraAttacker.reduce((sum, g) => sum + g.count, 0);
  const primaryDefenders = defenderTotal - extraDefender.reduce((sum, g) => sum + g.count, 0);
  if (primaryAttackers < 1 || primaryDefenders < 1) throw new RangeError('SQUAD_GROUP_COUNTS');
  const groups = [{ count: primaryAttackers, weapons: [individualProfile(input), ...(input.primaryExtraWeapons ?? [])] }, ...extraAttacker];
  const weaponGroups = groups.flatMap(group => {
    if (!group.weapons.length || group.weapons.length > 5) throw new RangeError('SQUAD_INVALID_INPUT');
    return group.weapons.map(profile => {
      if ((profile.attackType ?? 'ranged') !== (input.attackType ?? 'ranged')) throw new RangeError('SQUAD_INVALID_INPUT');
      const scenario = buildCombatScenario({ ...profile, modelCount: group.count, targetWounds: input.targetWounds,
        cover: input.cover, woundsMax: input.woundsMax, toughness: input.toughness, baseSave: input.baseSave });
      return scenario.weapon;
    });
  });
  const target = (profile: CombatScenarioInput, count: number, isCharacter?: boolean): SquadDefenderGroup => {
    const scenario = buildCombatScenario({ ...profile, attacks: 1, attacksExpression: '1', modelCount: 1,
      calculationBlocked: input.calculationBlocked, heavy: false, rapidFire: 0, melta: 0 });
    return { ...scenario.target, count, woundsMax: scenario.woundsMax, firstModelWounds: scenario.remainingWounds, isCharacter };
  };
  let defenders = [target(input, primaryDefenders, input.primaryIsCharacter),
    ...extraDefender.map(g => target(g.profile, g.count, g.isCharacter))];
  // Mandatory priorities take precedence; the declared order remains stable within each priority.
  const priority = (g: SquadDefenderGroup) => (g.isCharacter ? 2 : 0) + ((g.firstModelWounds ?? g.woundsMax) < g.woundsMax ? 0 : 1);
  defenders = defenders.map((g, order) => ({ g, order })).sort((a, b) => priority(a.g) - priority(b.g) || a.order - b.order).map(x => x.g);
  return { weaponGroups, defenders };
}
