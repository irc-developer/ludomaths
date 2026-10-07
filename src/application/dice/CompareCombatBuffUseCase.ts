import { CalculateRoundsToKillUseCase } from './CalculateRoundsToKillUseCase';
import type { Distribution } from '@domain/math/distribution';
import { expectedValue } from '@domain/math/distribution';
import type { UnitProfile } from '@domain/profiles/unitProfile';
import type { WeaponGroup } from '@domain/dice/weapon';

const DEFAULT_MAX_ROUNDS = 20;
const EPSILON = 1e-9;

export type CombatBuffRecommendation =
  | 'hitRoll'
  | 'ballisticSkill'
  | 'save'
  | 'armorPenetration'
  | 'damage'
  | 'equal';

export interface CombatBuffScenario {
  damagePerRoundDist: Distribution;
  expectedDamage: number;
  expectedWoundsLost?: number;
  survivingProbability?: number;
  computedRounds?: number;
  horizonLimited?: boolean;
  expectedRoundsToKill: number;
  firstRoundKillProbability: number;
}

export interface CompareCombatBuffInput {
  attacker: UnitProfile;
  defender: UnitProfile;
  maxRounds?: number;
  includeHitRoll?: boolean;
}

export interface CompareCombatBuffResult {
  baseline: CombatBuffScenario;
  plusBallisticSkill: CombatBuffScenario;
  plusHitRoll?: CombatBuffScenario;
  plusSave: CombatBuffScenario;
  plusArmorPenetration: CombatBuffScenario;
  plusDamage: CombatBuffScenario;
  recommendedOption: CombatBuffRecommendation;
}

interface BuffCandidate {
  option: Exclude<CombatBuffRecommendation, 'equal'>;
  scenario: CombatBuffScenario;
}

export class CompareCombatBuffUseCase {
  private readonly roundsUseCase = new CalculateRoundsToKillUseCase();

  execute(input: CompareCombatBuffInput): CompareCombatBuffResult {
    const { attacker, defender, maxRounds = DEFAULT_MAX_ROUNDS } = input;

    const baseline = this.evaluate(attacker, defender, maxRounds);
    const plusBallisticSkill = this.evaluate(
      { ...attacker, weaponGroups: buffBallisticSkill(attacker.weaponGroups) },
      defender,
      maxRounds,
    );
    const plusHitRoll = input.includeHitRoll ? this.evaluate({ ...attacker,
      weaponGroups: attacker.weaponGroups.map(group => group.torrent ? group : { ...group, hitModifier: (group.hitModifier ?? 0) + 1 }) }, defender, maxRounds) : undefined;
    const plusSave = this.evaluate(
      attacker,
      buffSave(defender),
      maxRounds,
    );
    const plusArmorPenetration = this.evaluate(
      { ...attacker, weaponGroups: buffArmorPenetration(attacker.weaponGroups) },
      defender,
      maxRounds,
    );
    const plusDamage = this.evaluate(
      { ...attacker, weaponGroups: buffDamage(attacker.weaponGroups) },
      defender,
      maxRounds,
    );

    return {
      baseline,
      plusBallisticSkill,
      ...(plusHitRoll ? { plusHitRoll } : {}),
      plusSave,
      plusArmorPenetration,
      plusDamage,
      recommendedOption: chooseRecommendation([
        { option: 'ballisticSkill', scenario: plusBallisticSkill },
        ...(plusHitRoll ? [{ option: 'hitRoll' as const, scenario: plusHitRoll }] : []),
        { option: 'armorPenetration', scenario: plusArmorPenetration },
        { option: 'damage', scenario: plusDamage },
      ]),
    };
  }

  private evaluate(
    attacker: UnitProfile,
    defender: UnitProfile,
    maxRounds: number,
  ): CombatBuffScenario {
    const result = this.roundsUseCase.execute({
      weaponGroups: attacker.weaponGroups,
      toughness: defender.toughness,
      savePools: defender.savePools,
      targetWounds: defender.wounds,
      maxRounds,
    });

    return {
      damagePerRoundDist: result.damagePerRoundDist,
      expectedDamage: expectedValue(result.damagePerRoundDist),
      expectedWoundsLost: result.damagePerRoundDist.reduce((sum, e) => sum + Math.min(defender.wounds, e.value) * e.probability, 0),
      survivingProbability: result.survivingProbability,
      computedRounds: result.killByRound.length,
      horizonLimited: result.horizonLimited,
      expectedRoundsToKill: result.expectedRounds,
      firstRoundKillProbability: result.killByRound[0]?.cumulativeProbability ?? 0,
    };
  }
}

function buffBallisticSkill(weaponGroups: WeaponGroup[]): WeaponGroup[] {
  return weaponGroups.map(group => (
    group.torrent === true
      ? group
      : {
          ...group,
          hitThreshold: Math.max(2, group.hitThreshold - 1),
        }
  ));
}

function buffSave(defender: UnitProfile): UnitProfile {
  return {
    ...defender,
    savePools: defender.savePools.map(pool => ({
      ...pool,
      baseSave: Math.max(2, pool.baseSave - 1),
    })),
  };
}

function buffArmorPenetration(weaponGroups: WeaponGroup[]): WeaponGroup[] {
  return weaponGroups.map(group => ({
    ...group,
    ap: group.ap + 1,
  }));
}

function buffDamage(weaponGroups: WeaponGroup[]): WeaponGroup[] {
  return weaponGroups.map(group => ({
    ...group,
    damageDist: group.damageDist.map(entry => ({
      value: entry.value + 1,
      probability: entry.probability,
    })),
    guaranteedDamageValue: group.guaranteedDamageValue == null
      ? undefined
      : group.guaranteedDamageValue + 1,
  }));
}

function chooseRecommendation(
  candidates: readonly BuffCandidate[],
): CombatBuffRecommendation {
  // For one miniature, damage beyond its remaining wounds provides no benefit.
  const score = (scenario: CombatBuffScenario) => scenario.expectedWoundsLost ?? scenario.expectedDamage;
  const bestDamage = Math.max(...candidates.map(candidate => score(candidate.scenario)));
  let remaining = candidates.filter(candidate =>
    Math.abs(score(candidate.scenario) - bestDamage) <= EPSILON,
  );
  if (remaining.length === 1) {
    return remaining[0].option;
  }

  const bestRounds = Math.min(...remaining.map(candidate => candidate.scenario.expectedRoundsToKill));
  remaining = remaining.filter(candidate =>
    candidate.scenario.expectedRoundsToKill === bestRounds || Math.abs(candidate.scenario.expectedRoundsToKill - bestRounds) <= EPSILON,
  );
  if (remaining.length === 1) {
    return remaining[0].option;
  }

  const bestKillChance = Math.max(...remaining.map(candidate => candidate.scenario.firstRoundKillProbability));
  remaining = remaining.filter(candidate =>
    Math.abs(candidate.scenario.firstRoundKillProbability - bestKillChance) <= EPSILON,
  );

  return remaining.length === 1 ? remaining[0].option : 'equal';
}