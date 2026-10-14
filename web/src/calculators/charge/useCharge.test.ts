import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useCharge } from './useCharge';

afterEach(cleanup);

describe('useCharge', () => {
  it('keeps fractional distances and updates when the modifier changes', () => {
    const { result, rerender } = renderHook(({ modifier }) => useCharge({ distance: 9.1, chargeRollModifier: modifier }), {
      initialProps: { modifier: 0 },
    });
    expect(result.current.currentProbability).toBeCloseTo(6 / 36, 12);
    rerender({ modifier: 1 });
    expect(result.current.currentProbability).toBeCloseTo(10 / 36, 12);
  });

  it('offers only standard reference distances 3–12 and reflects the active policy', () => {
    const { result } = renderHook(() => useCharge({ distance: 9, observedSix: true, reroll: 'failures' }));
    expect(result.current.referenceTable.map(entry => entry.distance)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.current.referenceTable.find(entry => entry.distance === 9)?.probability).toBeCloseTo(41 / 54, 12);
  });

  it('updates the reference table with the modifier', () => {
    const { result, rerender } = renderHook(({ modifier }) => useCharge({ distance: 12, chargeRollModifier: modifier }), {
      initialProps: { modifier: 0 },
    });
    expect(result.current.referenceTable[9].probability).toBeCloseTo(1 / 36, 12);
    rerender({ modifier: 2 });
    expect(result.current.referenceTable[9].probability).toBeCloseTo(6 / 36, 12);
  });

  it('distinguishes outside-range and engagement-review states from zero probability', () => {
    const { result, rerender } = renderHook(({ distance }) => useCharge({ distance }), { initialProps: { distance: 13 } });
    expect(result.current).toMatchObject({ status: 'outsideRange', currentProbability: null });
    rerender({ distance: 2 });
    expect(result.current).toMatchObject({ status: 'checkEngagement', currentProbability: null });
    rerender({ distance: 12 });
    expect(result.current.status).toBe('ready');
  });

  it('invalid inputs clear the result and reference table, including invalid modifiers', () => {
    const { result, rerender } = renderHook(({ distance, modifier }) => useCharge({ distance, chargeRollModifier: modifier }), {
      initialProps: { distance: 9, modifier: 0 },
    });
    rerender({ distance: NaN, modifier: 0 });
    expect(result.current).toMatchObject({ status: 'invalid', currentProbability: null, referenceTable: [] });
    expect(result.current.error).toBeTruthy();
    rerender({ distance: 9, modifier: 0.5 });
    expect(result.current).toMatchObject({ status: 'invalid', currentProbability: null, referenceTable: [] });
    rerender({ distance: 9, modifier: 0 });
    expect(result.current.currentProbability).toBeCloseTo(10 / 36, 12);
    expect(result.current.error).toBeUndefined();
  });
});
