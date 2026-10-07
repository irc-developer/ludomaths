import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSquadCalculation } from './useSquadCalculation';
import { WH40K_PRESETS } from './presets';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('squad worker lifecycle', () => {
  it('cancels earlier work, hides stale results and accepts only the current reply', () => {
    vi.useFakeTimers();
    const workers: FakeWorker[] = [];
    class FakeWorker {
      onmessage?: (event: { data: { result: number } }) => void;
      onerror?: () => void;
      terminated = false;
      constructor() { workers.push(this); }
      postMessage() {}
      terminate() { this.terminated = true; }
    }
    vi.stubGlobal('Worker', FakeWorker);
    const { result, rerender } = renderHook(({ count }) => useSquadCalculation<number>({ kind: 'combat',
      params: { ...WH40K_PRESETS[0].params, targetModelCount: count } }, true), { initialProps: { count: 5 } });
    expect(result.current.pending).toBe(true);
    act(() => { vi.advanceTimersByTime(80); });
    rerender({ count: 10 });
    expect(workers[0].terminated).toBe(true);
    act(() => { workers[0].onmessage?.({ data: { result: 5 } }); });
    expect(result.current.result).toBeUndefined();
    expect(result.current.pending).toBe(true);
    act(() => { vi.advanceTimersByTime(80); workers[1].onmessage?.({ data: { result: 10 } }); });
    expect(result.current.pending).toBe(false);
    expect(result.current.result).toBe(10);
    expect(workers[1].terminated).toBe(true);
  });
});
