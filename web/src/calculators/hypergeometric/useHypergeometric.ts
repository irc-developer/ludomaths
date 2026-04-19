import { useMemo } from 'react';
import {
  hypergeometricProbability,
  hypergeometricAtLeast,
  hypergeometricAtMost,
  hypergeometricMean,
  hypergeometricVariance,
} from '@domain/math/hypergeometric';

export interface HypergeometricParams {
  /** Tamaño total del mazo (N). */
  N: number;
  /** Copias de la carta objetivo en el mazo (K). */
  K: number;
  /** Cartas robadas (n). */
  n: number;
  /** Copias deseadas en la muestra (k). */
  k: number;
}

/** View model: tipos primitivos, sin dependencias del dominio. */
export interface HypergeometricViewModel {
  exact:   number;
  atLeast: number;
  atMost:  number;
  mean:    number;
  stdDev:  number;
  error?:  string;
}

/**
 * Adaptador entre el use case hipergeométrico y la capa de presentación.
 *
 * Contrato hexagonal:
 * - Importa de @domain (funciones puras de probabilidad).
 * - Devuelve un view model plano que los componentes consumen sin conocer el dominio.
 */
export function useHypergeometric({ N, K, n, k }: HypergeometricParams): HypergeometricViewModel {
  return useMemo(() => {
    try {
      return {
        exact:   hypergeometricProbability(N, K, n, k),
        atLeast: hypergeometricAtLeast(N, K, n, k),
        atMost:  hypergeometricAtMost(N, K, n, k),
        mean:    hypergeometricMean(N, K, n),
        stdDev:  Math.sqrt(hypergeometricVariance(N, K, n)),
      };
    } catch (e) {
      return {
        exact: 0, atLeast: 0, atMost: 0, mean: 0, stdDev: 0,
        error: e instanceof Error ? e.message : 'Error desconocido',
      };
    }
  }, [N, K, n, k]);
}
