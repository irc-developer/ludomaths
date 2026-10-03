import { useMemo } from 'react';
import { CompareCombatBuffUseCase, type CompareCombatBuffResult } from '@application/dice/CompareCombatBuffUseCase';
import type { UnitProfile } from '@domain/profiles/unitProfile';
import type { Distribution } from '@domain/math/distribution';
import type { CombatParams } from '../combat/presets';
import { resolveRerollPolicy } from '../combat/rerollPolicy';

export interface CombatBuffComparisonViewModel extends CompareCombatBuffResult {
  error?: string;
}

const useCase = new CompareCombatBuffUseCase();
const D6: Distribution = [1, 2, 3, 4, 5, 6].map(value => ({ value, probability: 1 / 6 }));

export function useCombatBuffComparison(params: CombatParams): CombatBuffComparisonViewModel {
  return useMemo(() => {
    try {
      const attacker = buildAttacker(params);
      const defender = buildDefender(params);
      return useCase.execute({ attacker, defender });
    } catch (error) {
      return {
        baseline: emptyScenario(),
        plusBallisticSkill: emptyScenario(),
        plusSave: emptyScenario(),
        plusArmorPenetration: emptyScenario(),
        plusDamage: emptyScenario(),
        recommendedOption: 'equal',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [params]);
}

function buildAttacker(params: CombatParams): UnitProfile {
  const baseDamageDist = params.damageD6 ? D6 : fixed(params.damage);
  const damageBonus = params.damageBonus ?? 0;
  const damageDist = damageBonus === 0
    ? baseDamageDist
    : baseDamageDist.map(entry => ({ value: entry.value + damageBonus, probability: entry.probability }));

  return {
    name: 'Attacker',
    wounds: 1,
    toughness: 1,
    savePools: [{ baseSave: 6, fraction: 1 }],
    weaponGroups: [{
      attacksDist: params.attacksD6 ? D6 : fixed(params.attacks),
      hitThreshold: params.hitThreshold,
      hitReroll: resolveRerollPolicy(params.hitRerollAll, params.hitRerollNonSixes, params.torrent),
      guaranteedHitSixes: params.guaranteedHitSix ? 1 : undefined,
      strengthDist: fixed(params.strength),
      woundReroll: resolveRerollPolicy(params.woundRerollAll, params.woundRerollNonSixes),
      guaranteedWoundSixes: params.guaranteedWoundSix ? 1 : undefined,
      ap: params.ap,
      damageDist,
      guaranteedDamageValue: params.damageD6 && params.guaranteedDamageSix ? 6 + damageBonus : undefined,
      sustainedHits: normalizeOptionalPositiveInteger(params.sustainedHits),
      lethalHits: params.lethalHits,
      devastatingWounds: params.devastatingWounds,
      mortalWoundsPerHit: normalizeOptionalPositiveInteger(params.mortalWoundsPerHit),
      torrent: params.torrent,
      modelCount: 1,
    }],
  };
}

function buildDefender(params: CombatParams): UnitProfile {
  return {
    name: 'Defender',
    wounds: params.targetWounds,
    toughness: params.toughness,
    weaponGroups: [],
    savePools: [{
      baseSave: params.baseSave,
      fraction: 1,
      invulnerableSave: normalizeOptionalBoundedValue(params.invulnerableSave),
      fnpThreshold: normalizeOptionalBoundedValue(params.fnpThreshold),
      guaranteedSaves: params.guaranteedSaveSix ? 1 : undefined,
    }],
  };
}

function fixed(value: number): Distribution {
  return [{ value, probability: 1 }];
}

function normalizeOptionalBoundedValue(value: number | undefined): number | undefined {
  if (value == null || value <= 0) {
    return undefined;
  }

  return value;
}

function normalizeOptionalPositiveInteger(value: number | undefined): number | undefined {
  if (value == null || value <= 0) {
    return undefined;
  }

  return Math.round(value);
}

function emptyScenario() {
  return {
    damagePerRoundDist: [{ value: 0, probability: 1 }],
    expectedDamage: 0,
    expectedRoundsToKill: 0,
    firstRoundKillProbability: 0,
  };
}
