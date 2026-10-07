import { useCatalogInput } from '../../catalog/CatalogContext';
import { scenarioError } from '../../i18n/scenario';
import { useMemo } from 'react';
import { CompareCombatBuffUseCase, type CompareCombatBuffResult } from '@application/dice/CompareCombatBuffUseCase';
import type { UnitProfile } from '@domain/profiles/unitProfile';
import type { CombatParams } from '../combat/presets';
import { buildCombatScenario } from '@application/dice/combatScenario';
import { isSquadScenario } from '@application/dice/squadScenario';
import type { SquadImprovementResult } from '@application/dice/CompareSquadImprovementsUseCase';
import { useSquadCalculation } from '../combat/useSquadCalculation';
import { calculateSquad } from '../combat/squadCalculations';

export interface CombatBuffComparisonViewModel extends CompareCombatBuffResult {
  squadComparison?: SquadImprovementResult;
  isCalculating?: boolean;
  error?: string;
}

const useCase = new CompareCombatBuffUseCase();

export function useCombatBuffComparison(params: CombatParams): CombatBuffComparisonViewModel {
  const catalogParams = useCatalogInput(params);
  const squadMode = isSquadScenario(catalogParams);
  const async = useSquadCalculation<SquadImprovementResult>({ kind: 'improvements', params: catalogParams }, squadMode);
  return useMemo(() => {
    try {
      if (squadMode) {
        if (async.pending || async.error) return { baseline: emptyScenario(), plusBallisticSkill: emptyScenario(), plusSave: emptyScenario(),
          plusArmorPenetration: emptyScenario(), plusDamage: emptyScenario(), recommendedOption: 'equal' as const, isCalculating: async.pending, error: async.error };
        const squadComparison = async.available ? async.result! : calculateSquad({ kind: 'improvements', params: catalogParams }) as SquadImprovementResult;
        return { squadComparison, baseline: emptyScenario(), plusBallisticSkill: emptyScenario(), plusSave: emptyScenario(),
          plusArmorPenetration: emptyScenario(), plusDamage: emptyScenario(), recommendedOption: squadComparison.recommendedOption };
      }
      const scenario = buildCombatScenario(catalogParams);
      const attacker: UnitProfile = { name: 'Attacker', wounds: 1, toughness: 1,
        savePools: [{ fraction: 1, baseSave: 6 }], weaponGroups: [scenario.weapon] };
      const defender: UnitProfile = { name: 'Defender', wounds: scenario.remainingWounds,
        toughness: scenario.target.toughness, weaponGroups: [],
        savePools: [{ ...scenario.target, fraction: 1, guaranteedSaves: params.guaranteedSaveSix ? 1 : undefined }] };
      return useCase.execute({ attacker, defender, includeHitRoll: true });
    } catch (error) {
      return {
        baseline: emptyScenario(),
        plusBallisticSkill: emptyScenario(),
        plusSave: emptyScenario(),
        plusArmorPenetration: emptyScenario(),
        plusDamage: emptyScenario(),
        recommendedOption: 'equal',
        error: scenarioError(error),
      };
    }
  }, [params, catalogParams, squadMode, async.available, async.pending, async.error, async.result]);
}

function emptyScenario() {
  return {
    damagePerRoundDist: [{ value: 0, probability: 1 }],
    expectedDamage: 0,
    expectedRoundsToKill: Infinity,
    firstRoundKillProbability: 0,
  };
}
