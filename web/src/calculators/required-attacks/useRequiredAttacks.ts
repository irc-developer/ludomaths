import { useMemo } from 'react';
import { CalculateRequiredAttacksUseCase } from '@application/dice/CalculateRequiredAttacksUseCase';
import type { CombatParams } from '../combat/presets';
import { resolveRerollPolicy } from '../combat/rerollPolicy';

export type RequiredAttacksParams = Omit<CombatParams,
  'attacks' | 'attacksD6' | 'damageD6' | 'guaranteedHitSix' | 'guaranteedWoundSix' | 'guaranteedDamageSix' | 'guaranteedSaveSix'> & {
  damageType: 'fixed' | 'D3' | 'D6';
  successPercent: number;
};

const useCase = new CalculateRequiredAttacksUseCase();

export function useRequiredAttacks(params: RequiredAttacksParams) {
  return useMemo(() => {
    try {
      const damageValues = params.damageType === 'D6' ? [1, 2, 3, 4, 5, 6] :
        params.damageType === 'D3' ? [1, 2, 3] : [params.damage];
      const result = useCase.execute({
        weapon: {
          hitThreshold: params.hitThreshold,
          hitReroll: resolveRerollPolicy(params.hitRerollAll, params.hitRerollNonSixes, params.torrent),
          strengthDist: [{ value: params.strength, probability: 1 }],
          woundReroll: resolveRerollPolicy(params.woundRerollAll, params.woundRerollNonSixes),
          ap: params.ap,
          damageDist: damageValues.map(value => ({ value: value + (params.damageBonus ?? 0), probability: 1 / damageValues.length })),
          torrent: params.torrent,
          sustainedHits: params.sustainedHits,
          lethalHits: params.lethalHits,
          devastatingWounds: params.devastatingWounds,
          mortalWoundsPerHit: params.mortalWoundsPerHit,
        },
        target: {
          toughness: params.toughness,
          baseSave: params.baseSave,
          invulnerableSave: params.invulnerableSave,
          fnpThreshold: params.fnpThreshold,
        },
        targetWounds: params.targetWounds,
        successProbability: params.successPercent / 100,
      });
      return { result, error: undefined };
    } catch (error) {
      return { result: undefined, error: error instanceof Error ? error.message : 'Error al calcular los ataques.' };
    }
  }, [params]);
}
