/**
 * Tests del adaptador useHypergeometric.
 *
 * Contrato verificado:
 * - Los valores del view model coinciden con la función hipergeométrica.
 * - El campo `error` aparece cuando el dominio lanza RangeError.
 * - El campo `error` NO aparece con parámetros válidos.
 *
 * Valores de referencia (N=4, K=2, n=2, k=1):
 *   P(X=1)  = C(2,1)·C(2,1) / C(4,2) = 4/6 = 2/3
 *   P(X≥1)  = 1 − P(X=0) = 1 − C(2,0)·C(2,2)/C(4,2) = 1 − 1/6 = 5/6
 *   P(X≤1)  = P(X=0) + P(X=1) = 1/6 + 4/6 = 5/6
 *   E[X]    = n·K/N = 2·2/4 = 1
 *   Var[X]  = n·(K/N)·(1−K/N)·(N−n)/(N−1) = 2·(1/2)·(1/2)·(2/3) = 1/3
 *   σ       = √(1/3) ≈ 0.5774
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHypergeometric } from './useHypergeometric';

const VALID_PARAMS = { N: 4, K: 2, n: 2, k: 1 } as const;

describe('useHypergeometric', () => {
  describe('happy path — N=4, K=2, n=2, k=1', () => {
    it('exact probability = C(2,1)·C(2,1)/C(4,2) = 2/3', () => {
      const { result } = renderHook(() => useHypergeometric(VALID_PARAMS));
      expect(result.current.exact).toBeCloseTo(2 / 3, 8);
    });

    it('atLeast = 1 − P(X=0) = 5/6', () => {
      const { result } = renderHook(() => useHypergeometric(VALID_PARAMS));
      expect(result.current.atLeast).toBeCloseTo(5 / 6, 8);
    });

    it('atMost = P(X=0) + P(X=1) = 5/6', () => {
      const { result } = renderHook(() => useHypergeometric(VALID_PARAMS));
      expect(result.current.atMost).toBeCloseTo(5 / 6, 8);
    });

    it('mean E[X] = n·K/N = 1', () => {
      const { result } = renderHook(() => useHypergeometric(VALID_PARAMS));
      expect(result.current.mean).toBeCloseTo(1, 8);
    });

    it('stdDev σ = √(1/3)', () => {
      const { result } = renderHook(() => useHypergeometric(VALID_PARAMS));
      expect(result.current.stdDev).toBeCloseTo(Math.sqrt(1 / 3), 8);
    });

    it('no `error` field for valid params', () => {
      const { result } = renderHook(() => useHypergeometric(VALID_PARAMS));
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('invariants', () => {
    it('atLeast + atMost − exact ≈ 1 (probability law)', () => {
      const { result } = renderHook(() => useHypergeometric(VALID_PARAMS));
      const { exact, atLeast, atMost } = result.current;
      // P(X≥k) + P(X≤k) - P(X=k) = 1  for any valid k
      expect(atLeast + atMost - exact).toBeCloseTo(1, 8);
    });

    it('k=0 → atLeast=1 (certain to draw at least 0 copies)', () => {
      const { result } = renderHook(() => useHypergeometric({ ...VALID_PARAMS, k: 0 }));
      expect(result.current.atLeast).toBeCloseTo(1, 8);
    });
  });

  describe('error path', () => {
    it('sets `error` when K > N (impossible deck)', () => {
      // K=10 copies in a deck of N=5 — violates the domain invariant.
      const { result } = renderHook(() =>
        useHypergeometric({ N: 5, K: 10, n: 2, k: 1 }),
      );
      expect(result.current.error).toBeDefined();
    });

    it('sets `error` when n > N (drawing more cards than in the deck)', () => {
      const { result } = renderHook(() =>
        useHypergeometric({ N: 3, K: 2, n: 5, k: 1 }),
      );
      expect(result.current.error).toBeDefined();
    });
  });
});
