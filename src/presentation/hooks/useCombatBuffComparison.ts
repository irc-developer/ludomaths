import { useMemo } from 'react';
import { CompareCombatBuffUseCase } from '@application/dice/CompareCombatBuffUseCase';
import type { CompareCombatBuffResult } from '@application/dice/CompareCombatBuffUseCase';
import type { UnitProfile } from '@domain/profiles/unitProfile';

export interface CombatBuffComparisonInput {
  attacker: UnitProfile | null;
  defender: UnitProfile | null;
}

export function useCombatBuffComparison(
  input: CombatBuffComparisonInput,
): CompareCombatBuffResult | null {
  const useCase = useMemo(() => new CompareCombatBuffUseCase(), []);
  const { attacker, defender } = input;

  return useMemo(() => {
    if (attacker == null || defender == null) {
      return null;
    }

    if (attacker.weaponGroups.length === 0) {
      return null;
    }

    return useCase.execute({ attacker, defender });
  }, [attacker, defender, useCase]);
}