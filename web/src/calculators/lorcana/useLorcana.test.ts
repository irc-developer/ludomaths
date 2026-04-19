/**
 * Tests del adaptador useLorcana.
 *
 * Contrato verificado:
 * - `mulliganProb` refleja la regla específica de Lorcana: 1 − P(fallo)².
 * - `pOnCurve` y `expectedInk` siguen sus invariantes matemáticos.
 * - `error` aparece cuando los parámetros violan las precondiciones del dominio.
 *
 * Invariantes matemáticos verificables:
 *
 *   mulliganAtLeast(N, 0, hand, 1) = 0
 *     Sin copias de la carta, la probabilidad es siempre 0.
 *
 *   mulliganAtLeast(N, N, hand, 1) = 1
 *     Si todas las cartas son la carta objetivo, siempre está en mano.
 *
 *   pOnCurveByTurn(N, K, 0, hand) = 1
 *     En el turno 0 no hay que inkear nada → siempre "on curve".
 *
 *   expectedInkByTurn(N, K, 0, hand) = 0
 *     En el turno 0 aún no se ha inkeado nada.
 *
 *   expectedInk(T) ≤ T
 *     No se puede inkear más veces que el número de turnos.
 *
 *   mulliganProb ≥ singleHandProb
 *     El mulligan siempre mejora o iguala la probabilidad de encontrar la carta.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { hypergeometricAtLeast } from '@domain/math/hypergeometric';
import { useLorcana } from './useLorcana';

/** Mazo estándar de Lorcana: 60 cartas, mano de 7. */
const STANDARD = { N: 60, handSize: 7 } as const;

describe('useLorcana', () => {
  describe('mulliganProb', () => {
    it('es 0 cuando no hay copias de la carta en el mazo (K=0)', () => {
      const { result } = renderHook(() =>
        useLorcana({ ...STANDARD, K: 0, k: 1, inkableCards: 30, turn: 1 }),
      );
      expect(result.current.mulliganProb).toBeCloseTo(0, 8);
    });

    it('es 1 cuando todas las cartas del mazo son la carta objetivo (K=N)', () => {
      const { result } = renderHook(() =>
        useLorcana({ ...STANDARD, K: 60, k: 1, inkableCards: 30, turn: 1 }),
      );
      expect(result.current.mulliganProb).toBeCloseTo(1, 8);
    });

    it('es mayor o igual que la probabilidad sin mulligan (1 sola mano)', () => {
      // mulliganAtLeast = 1 − P(fallo)² ≥ 1 − P(fallo) = P(éxito en 1 mano)
      const params = { ...STANDARD, K: 4, k: 1, inkableCards: 40, turn: 1 };
      const { result } = renderHook(() => useLorcana(params));
      const singleHandProb = hypergeometricAtLeast(params.N, params.K, params.handSize, params.k);
      expect(result.current.mulliganProb).toBeGreaterThanOrEqual(singleHandProb - 1e-9);
    });
  });

  describe('pOnCurve y expectedInk', () => {
    it('pOnCurve = 1 en el turno 0 (nada que inkear aún)', () => {
      const { result } = renderHook(() =>
        useLorcana({ ...STANDARD, K: 4, k: 1, inkableCards: 40, turn: 0 }),
      );
      expect(result.current.pOnCurve).toBeCloseTo(1, 8);
    });

    it('expectedInk = 0 en el turno 0', () => {
      const { result } = renderHook(() =>
        useLorcana({ ...STANDARD, K: 4, k: 1, inkableCards: 40, turn: 0 }),
      );
      expect(result.current.expectedInk).toBeCloseTo(0, 8);
    });

    it('expectedInk(T) ≤ T — no se puede inkear más turnos de los que existen', () => {
      const turn = 5;
      const { result } = renderHook(() =>
        useLorcana({ ...STANDARD, K: 4, k: 1, inkableCards: 40, turn }),
      );
      expect(result.current.expectedInk).toBeLessThanOrEqual(turn + 1e-9);
    });

    it('más cartas inkable aumentan pOnCurve (monotonía con K_ink)', () => {
      const base = { ...STANDARD, K: 4, k: 1, turn: 4 };
      const { result: r1 } = renderHook(() => useLorcana({ ...base, inkableCards: 20 }));
      const { result: r2 } = renderHook(() => useLorcana({ ...base, inkableCards: 50 }));
      expect(r2.current.pOnCurve).toBeGreaterThan(r1.current.pOnCurve);
    });
  });

  describe('error path', () => {
    it('establece `error` cuando handSize + turn > N', () => {
      // handSize=7 + turn=10 = 17 > N=10 → violación de precondición del dominio
      const { result } = renderHook(() =>
        useLorcana({ N: 10, K: 4, handSize: 7, k: 1, inkableCards: 5, turn: 10 }),
      );
      expect(result.current.error).toBeDefined();
    });
  });
});
