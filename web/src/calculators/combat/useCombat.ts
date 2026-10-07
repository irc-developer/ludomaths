import { useCatalogInput } from '../../catalog/CatalogContext';
import { scenarioError } from '../../i18n/scenario';
import { useMemo } from 'react';
import { expectedValue, type Distribution } from '@domain/math/distribution';
import { CalculateUnitCombatUseCase } from '@application/dice/CalculateUnitCombatUseCase';
import type { CombatParams } from './presets';
import { buildCombatScenario } from '@application/dice/combatScenario';
import { isSquadScenario } from '@application/dice/squadScenario';
import type { SquadCombatResult } from '@application/dice/CalculateSquadCombatUseCase';
import { calculateSquad } from './squadCalculations';
import { useSquadCalculation } from './useSquadCalculation';

// Singleton stateless — creado una vez a nivel de módulo.
const combatUseCase = new CalculateUnitCombatUseCase();

function fixed(n: number): Distribution {
  return [{ value: n, probability: 1 }];
}


function probabilityAtLeast(dist: Distribution, threshold: number): number {
  return dist
    .filter(entry => entry.value >= threshold)
    .reduce((sum, entry) => sum + entry.probability, 0);
}

function medianOutcome(dist: Distribution): number {
  let cumulative = 0;

  for (const entry of dist) {
    cumulative += entry.probability;
    if (cumulative >= 0.5) {
      return entry.value;
    }
  }

  return dist[dist.length - 1]?.value ?? 0;
}

function modeOutcome(dist: Distribution): number {
  let best = dist[0];

  for (const entry of dist) {
    if (best == null || entry.probability > best.probability) {
      best = entry;
    }
  }

  return best?.value ?? 0;
}

/**
 * Returns the smallest value x in `dist` such that P(X ≤ x) ≥ p.
 * For a discrete distribution this is the standard "lower" quantile.
 */
function quantile(dist: Distribution, p: number): number {
  let cumulative = 0;

  for (const entry of dist) {
    cumulative += entry.probability;
    if (cumulative >= p) {
      return entry.value;
    }
  }

  return dist[dist.length - 1]?.value ?? 0;
}

/** View model plano: sin tipos del dominio, listo para renderizar. */
export interface CombatViewModel {
  squad?: SquadCombatResult;
  isCalculating?: boolean;
  expectedDamage: number;
  expectedWoundsLost?: number;
  medianDamage: number;
  mostLikelyDamage: number;
  /** Central P50 interval [Q25, Q75]: the range containing the middle 50 % of outcomes. */
  centralRange: { low: number; high: number };
  pAtLeastOne:    number;
  pEliminate:     number;
  /** Distribución completa mapeada a primitivos para DistributionBar. */
  distribution: Array<{ value: number; probability: number }>;
  error?: string;
}

/**
 * Adaptador entre CalculateUnitCombatUseCase y la presentación.
 *
 * Transforma los parámetros planos del formulario en las Distribution del
 * dominio, ejecuta el pipeline y devuelve un view model con estadísticas
 * clave y la distribución serializada a primitivos.
 */
export function useCombat(params: CombatParams): CombatViewModel {
  const catalogParams = useCatalogInput(params);
  const squadMode = isSquadScenario(catalogParams);
  const async = useSquadCalculation<SquadCombatResult>({ kind: 'combat', params: catalogParams }, squadMode);
  return useMemo(() => {
    try {
      if (squadMode) {
        if (async.pending || async.error) return { expectedDamage: 0, expectedWoundsLost: 0, medianDamage: 0, mostLikelyDamage: 0,
          centralRange: { low: 0, high: 0 }, pAtLeastOne: 0, pEliminate: 0, distribution: [], isCalculating: async.pending, error: async.error };
        const squad = async.available ? async.result! : calculateSquad({ kind: 'combat', params: catalogParams }) as SquadCombatResult;
        const dist = squad.woundsLostDist;
        return { squad, expectedDamage: squad.expectedWoundsLost, expectedWoundsLost: squad.expectedWoundsLost,
          medianDamage: medianOutcome(dist), mostLikelyDamage: modeOutcome(dist),
          centralRange: { low: quantile(dist, .25), high: quantile(dist, .75) },
          pAtLeastOne: probabilityAtLeast(dist, 1), pEliminate: squad.pEliminate, distribution: [...dist] };
      }
      const scenario = buildCombatScenario(catalogParams);
      const result = combatUseCase.execute({ weaponGroups: [scenario.weapon], toughness: scenario.target.toughness,
        savePools: [{ ...scenario.target, fraction: 1, guaranteedSaves: params.guaranteedSaveSix ? 1 : undefined }] });
      const dist = result.totalDamageDist;
      return { expectedDamage: expectedValue(dist),
        expectedWoundsLost: dist.reduce((sum, e) => sum + Math.min(params.targetWounds, e.value) * e.probability, 0),
        medianDamage: medianOutcome(dist), mostLikelyDamage: modeOutcome(dist),
        centralRange: { low: quantile(dist, 0.25), high: quantile(dist, 0.75) },
        pAtLeastOne: probabilityAtLeast(dist, 1), pEliminate: probabilityAtLeast(dist, params.targetWounds), distribution: dist.map(entry => ({ ...entry })) };
    } catch (error) {
      return { expectedDamage: 0, expectedWoundsLost: 0, medianDamage: 0, mostLikelyDamage: 0,
        centralRange: { low: 0, high: 0 }, pAtLeastOne: 0, pEliminate: 0, distribution: [],
        error: scenarioError(error) };
    }
  }, [params, catalogParams, squadMode, async.available, async.pending, async.error, async.result]);
}
