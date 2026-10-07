import { useCatalogInput } from '../../catalog/CatalogContext';
import { scenarioError } from '../../i18n/scenario';
import { useMemo } from 'react';
import { CalculateRequiredAttacksUseCase } from '@application/dice/CalculateRequiredAttacksUseCase';
import type { CombatParams } from '../combat/presets';
import { buildCombatScenario } from '@application/dice/combatScenario';
import { isSquadScenario } from '@application/dice/squadScenario';
import type { RequiredSquadResult } from '@application/dice/CalculateRequiredSquadAmountUseCase';
import { useSquadCalculation } from '../combat/useSquadCalculation';
import { calculateSquad } from '../combat/squadCalculations';

export type RequiredAttacksParams = Omit<CombatParams,
  'attacks' | 'attacksD6' | 'damageD6' | 'guaranteedHitSix' | 'guaranteedWoundSix' | 'guaranteedDamageSix' | 'guaranteedSaveSix'> & {
  damageType: 'fixed' | 'D3' | 'D6';
  attacks?: number;
  successPercent: number;
};

const useCase = new CalculateRequiredAttacksUseCase();

export function useRequiredAttacks(params: RequiredAttacksParams) {
  const catalogParams = useCatalogInput({ ...params, attacks: params.attacks ?? 1 });
  const squadMode = isSquadScenario(catalogParams);
  const request = { kind: 'required' as const, params: { ...catalogParams, successPercent: params.successPercent } };
  const async = useSquadCalculation<RequiredSquadResult>(request, squadMode);
  return useMemo(() => {
    try {
      if (squadMode) {
        if (async.pending || async.error) return { result: undefined, squadResult: undefined, isCalculating: async.pending, error: async.error };
        const squadResult = async.available ? async.result! : calculateSquad(request) as RequiredSquadResult;
        return { result: undefined, squadResult, error: undefined };
      }
      const scenario = buildCombatScenario({ ...catalogParams, attacks: 1, modelCount: 1,
        damageExpression: catalogParams.damageExpression ?? (params.damageType === 'fixed' ? String(params.damage) : params.damageType) });
      const result = useCase.execute({
        weapon: scenario.weapon,
        target: scenario.target,
        targetWounds: params.targetWounds,
        successProbability: params.successPercent / 100,
      });
      return { result, error: undefined };
    } catch (error) {
      return { result: undefined, error: scenarioError(error) };
    }
  }, [params, catalogParams, squadMode, async.available, async.pending, async.error, async.result]);
}
