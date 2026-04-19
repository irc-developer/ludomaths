/**
 * Tests del adaptador useCharge.
 *
 * Contrato verificado:
 * - `currentProbability` coincide con P(2D6 ≥ d) para distancias conocidas.
 * - `referenceTable` contiene exactamente 12 entradas (distancias 2"–13").
 * - Repetir dados de fallo (reroll='failures') mejora la probabilidad para d > 2.
 * - `error` se establece cuando la distancia viola la precondición del dominio.
 *
 * Valores de referencia:
 *   d=2:  P(2D6 ≥ 2) = 36/36 = 1       (mínimo posible de 2D6)
 *   d=7:  P(2D6 ≥ 7) = 21/36 = 7/12    (6+5+4+3+2+1 combinaciones)
 *   d=13: P(2D6 ≥ 13) = 0              (máximo posible de 2D6 es 12)
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCharge } from './useCharge';

describe('useCharge', () => {
  describe('probabilidades conocidas', () => {
    it('d=2 → probabilidad = 1 (siempre éxito)', () => {
      const { result } = renderHook(() => useCharge({ distance: 2, reroll: 'none' }));
      expect(result.current.currentProbability).toBeCloseTo(1, 8);
    });

    it('d=13 → probabilidad = 0 (imposible)', () => {
      const { result } = renderHook(() => useCharge({ distance: 13, reroll: 'none' }));
      expect(result.current.currentProbability).toBeCloseTo(0, 8);
    });

    it('d=7 → probabilidad = 7/12 ≈ 0.5833', () => {
      // Combinaciones de 2D6 ≥ 7: {(1,6),(2,5),(3,4),(4,3),(5,2),(6,1),(2,6),...} = 21
      const { result } = renderHook(() => useCharge({ distance: 7, reroll: 'none' }));
      expect(result.current.currentProbability).toBeCloseTo(7 / 12, 8);
    });
  });

  describe('tabla de referencia', () => {
    it('contiene exactamente 12 entradas (distancias 2"–13")', () => {
      const { result } = renderHook(() => useCharge({ distance: 7, reroll: 'none' }));
      expect(result.current.referenceTable).toHaveLength(12);
    });

    it('las distancias van de 2 a 13 en orden ascendente', () => {
      const { result } = renderHook(() => useCharge({ distance: 7, reroll: 'none' }));
      const distances = result.current.referenceTable.map(e => e.distance);
      expect(distances).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });

    it('las probabilidades son monótonamente decrecientes con la distancia', () => {
      const { result } = renderHook(() => useCharge({ distance: 7, reroll: 'none' }));
      const probs = result.current.referenceTable.map(e => e.probability);
      for (let i = 1; i < probs.length; i++) {
        expect(probs[i]).toBeLessThanOrEqual(probs[i - 1]);
      }
    });
  });

  describe('repetición de dados', () => {
    it('reroll=failures mejora la probabilidad para d=9 (riesgo real)', () => {
      const { result: r1 } = renderHook(() => useCharge({ distance: 9, reroll: 'none' }));
      const { result: r2 } = renderHook(() => useCharge({ distance: 9, reroll: 'failures' }));
      expect(r2.current.currentProbability).toBeGreaterThan(
        r1.current.currentProbability,
      );
    });
  });

  describe('error path', () => {
    it('establece `error` cuando la distancia es < 2', () => {
      const { result } = renderHook(() => useCharge({ distance: 1, reroll: 'none' }));
      expect(result.current.error).toBeDefined();
    });
  });
});
