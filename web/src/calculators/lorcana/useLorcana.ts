import { useMemo } from 'react';
import {
  mulliganAtLeast,
  pOnCurveByTurn,
  expectedInkByTurn,
} from '@domain/cards/lorcana';

export interface LorcanaParams {
  /** Tamaño del mazo (60 en estándar). */
  N: number;
  /** Copias de la carta objetivo (para mulligan). */
  K: number;
  /** Tamaño de la mano inicial (7 en estándar). */
  handSize: number;
  /** Mínimo de copias deseadas en la mano (para mulligan). */
  k: number;
  /** Cartas inkable en el mazo (para curva de ink). */
  inkableCards: number;
  /** Turno hasta el que evaluar la curva. */
  turn: number;
}

export interface LorcanaViewModel {
  /** P(tener al menos k copias tras mulligan libre). */
  mulliganProb: number;
  /** P(haber podido inkear todos los turnos hasta T). */
  pOnCurve:    number;
  /** E[cartas en el inkwell] al final del turno T. */
  expectedInk: number;
  error?: string;
}

/**
 * Adaptador entre las funciones de dominio de Lorcana y la presentación.
 *
 * Lorcana permite un mulligan libre (mano completa devuelta y re-robada).
 * Dado que el mazo se baraja completamente antes de cada robo, ambas manos
 * son eventos independientes: P(éxito con mulligan) = 1 − P(fallo)².
 */
export function useLorcana({
  N, K, handSize, k, inkableCards, turn,
}: LorcanaParams): LorcanaViewModel {
  return useMemo(() => {
    try {
      return {
        mulliganProb: mulliganAtLeast(N, K, handSize, k),
        pOnCurve:     pOnCurveByTurn(N, inkableCards, turn, handSize),
        expectedInk:  expectedInkByTurn(N, inkableCards, turn, handSize),
      };
    } catch (e) {
      return {
        mulliganProb: 0,
        pOnCurve: 0,
        expectedInk: 0,
        error: e instanceof Error ? e.message : 'Error desconocido',
      };
    }
  }, [N, K, handSize, k, inkableCards, turn]);
}
