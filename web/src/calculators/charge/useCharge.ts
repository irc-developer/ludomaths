import { useMemo } from 'react';
import { CalculateChargeProbabilityUseCase, type ChargeInput } from '@application/dice/CalculateChargeProbabilityUseCase';

export type ChargeParams = ChargeInput;

export interface ChargeTableEntry {
  distance: number;
  probability: number;
}

export interface ChargeViewModel {
  status: 'ready' | 'outsideRange' | 'checkEngagement' | 'invalid';
  currentProbability: number | null;
  /** Conditional reference probabilities for standard targets at 3″–12″. */
  referenceTable: ChargeTableEntry[];
  error?: string;
}

const chargeUseCase = new CalculateChargeProbabilityUseCase();

/** The hook adapts distance probabilities; it does not infer movement legality. */
export function useCharge({ distance, reroll = 'none', observedSix = false, chargeRollModifier = 0 }: ChargeParams): ChargeViewModel {
  return useMemo(() => {
    try {
      const result = chargeUseCase.execute({ distance, reroll, observedSix, chargeRollModifier });
      // Invalid inputs must not leave a table from an earlier valid calculation.
      const referenceTable = Array.from({ length: 10 }, (_, i) => i + 3).map(d => {
        const row = chargeUseCase.execute({ distance: d, reroll, observedSix, chargeRollModifier });
        return { distance: d, probability: row.status === 'ready' ? row.probability : 0 };
      });
      return { status: result.status, currentProbability: result.probability, referenceTable };
    } catch (error) {
      return {
        status: 'invalid', currentProbability: null, referenceTable: [],
        error: error instanceof Error ? error.message : 'Entrada inválida.',
      };
    }
  }, [distance, reroll, observedSix, chargeRollModifier]);
}
