import type { CombatScenarioInput } from '@application/dice/combatScenario';
import { buildSquadScenario } from '@application/dice/squadScenario';
import { CalculateSquadCombatUseCase } from '@application/dice/CalculateSquadCombatUseCase';
import { CompareSquadImprovementsUseCase } from '@application/dice/CompareSquadImprovementsUseCase';
import { CalculateRequiredSquadAmountUseCase } from '@application/dice/CalculateRequiredSquadAmountUseCase';
export type SquadRequest = { kind: 'combat' | 'required' | 'improvements'; params: CombatScenarioInput & { successPercent?: number } };
export function calculateSquad(request: SquadRequest) {
  const { kind, params } = request;
  if (kind === 'required') {
    const mixed = !!params.attackerEquipmentGroups?.length || !!params.primaryExtraWeapons?.length;
    const scenario = buildSquadScenario({ ...params, modelCount: mixed || params.requiredSquadUnit === 'activations' ? params.modelCount : 1 });
    return new CalculateRequiredSquadAmountUseCase().execute({ scenario,
      goal: params.casualtyGoal ?? params.targetModelCount ?? 1, successProbability: (params.successPercent ?? 90) / 100,
      unit: mixed ? 'activations' : params.requiredSquadUnit ?? 'attacks' });
  }
  const scenario = buildSquadScenario(params);
  return kind === 'combat' ? new CalculateSquadCombatUseCase().execute(scenario) : new CompareSquadImprovementsUseCase().execute(scenario);
}
