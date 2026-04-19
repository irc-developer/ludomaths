import { useMemo } from 'react';
import { expectedValue, type Distribution } from '@domain/math/distribution';
import { CalculateCombatResultUseCase } from '@application/dice/CalculateCombatResultUseCase';
import type { CombatParams } from './presets';

// Singleton stateless — creado una vez a nivel de módulo.
const combatUseCase = new CalculateCombatResultUseCase();

function fixed(n: number): Distribution {
  return [{ value: n, probability: 1 }];
}

const D6: Distribution = [1, 2, 3, 4, 5, 6].map(v => ({ value: v, probability: 1 / 6 }));

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
  expectedDamage: number;
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
 * Adaptador entre CalculateCombatResultUseCase y la presentación.
 *
 * Transforma los parámetros planos del formulario en las Distribution del
 * dominio, ejecuta el pipeline y devuelve un view model con estadísticas
 * clave y la distribución serializada a primitivos.
 */
export function useCombat(params: CombatParams): CombatViewModel {
  const {
    attacks, attacksD6, hitThreshold, strength, ap, damage, damageD6, damageBonus,
    toughness, targetWounds, baseSave, invulnerableSave, fnpThreshold, guaranteedSaveSix,
    sustainedHits, lethalHits, devastatingWounds, mortalWoundsPerHit, torrent,
  } = params;

  return useMemo(() => {
    try {
      const baseAttacksDist = attacksD6 ? D6 : fixed(attacks);
      const baseDamageDist = damageD6 ? D6 : fixed(damage);
      // Apply a constant bonus to all outcomes (e.g. D6+2 → shift each value by +2).
      const damageDist: Distribution =
        (damageBonus ?? 0) > 0
          ? baseDamageDist.map(e => ({ value: e.value + (damageBonus ?? 0), probability: e.probability }))
          : baseDamageDist;

      const result = combatUseCase.execute({
        attacksDist:  baseAttacksDist,
        hitThreshold,
        strengthDist: fixed(strength),
        ap,
        damageDist,
        toughness,
        baseSave,
        invulnerableSave,
        fnpThreshold,
        guaranteedSaves: guaranteedSaveSix ? 1 : undefined,
        sustainedHits,
        lethalHits,
        devastatingWounds,
        mortalWoundsPerHit,
        torrent,
      });

      const dist = result.totalDamageDist;
      return {
        expectedDamage:   expectedValue(dist),
        medianDamage:     medianOutcome(dist),
        mostLikelyDamage: modeOutcome(dist),
        centralRange:     { low: quantile(dist, 0.25), high: quantile(dist, 0.75) },
        pAtLeastOne:      probabilityAtLeast(dist, 1),
        pEliminate:       probabilityAtLeast(dist, targetWounds),
        distribution:     dist.map(e => ({ value: e.value, probability: e.probability })),
      };
    } catch (e) {
      return {
        expectedDamage: 0,
        medianDamage: 0,
        mostLikelyDamage: 0,
        centralRange: { low: 0, high: 0 },
        pAtLeastOne: 0,
        pEliminate: 0,
        distribution: [],
        error: e instanceof Error ? e.message : 'Error desconocido',
      };
    }
  }, [
    attacks, attacksD6, hitThreshold, strength, ap, damage, damageD6, damageBonus,
    toughness, targetWounds, baseSave, invulnerableSave, fnpThreshold, guaranteedSaveSix,
    sustainedHits, lethalHits, devastatingWounds, mortalWoundsPerHit, torrent,
  ]);
}
