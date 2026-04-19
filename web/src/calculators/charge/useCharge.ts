import { useMemo } from 'react';
import { CalculateChargeProbabilityUseCase } from '@application/dice/CalculateChargeProbabilityUseCase';

export interface ChargeParams {
  distance: number;
  reroll: 'none' | 'failures';
  /** When true, one die is already showing a 6. The effective roll is D6+6 instead of 2D6. */
  lockedSix?: boolean;
}

export interface ChargeTableEntry {
  distance: number;
  probability: number;
}

export interface ChargeViewModel {
  currentProbability: number;
  /** Tabla completa de referencia para distancias 2"–13". */
  referenceTable: ChargeTableEntry[];
  error?: string;
}

// Singleton: el use case es stateless, no hace falta recrearlo por render.
const chargeUseCase = new CalculateChargeProbabilityUseCase();

/**
 * Adaptador de CalculateChargeProbabilityUseCase para la presentación.
 *
 * Devuelve la probabilidad de la distancia actual y la tabla completa 2"–13"
 * para que el componente pueda mostrar comparaciones sin calcular nada.
 */
export function useCharge({ distance, reroll, lockedSix }: ChargeParams): ChargeViewModel {
  return useMemo(() => {
    // La tabla sólo depende del reroll y del lockedSix, no de la distancia concreta.
    const referenceTable: ChargeTableEntry[] = Array.from({ length: 12 }, (_, i) => i + 2).map(d => ({
      distance: d,
      probability: chargeUseCase.execute({ distance: d, reroll, lockedSix }).probability,
    }));

    try {
      return {
        currentProbability: chargeUseCase.execute({ distance, reroll, lockedSix }).probability,
        referenceTable,
      };
    } catch (e) {
      return {
        currentProbability: 0,
        referenceTable,
        error: e instanceof Error ? e.message : 'Error desconocido',
      };
    }
  }, [distance, reroll, lockedSix]);
}
