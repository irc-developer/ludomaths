import { useEffect, useState } from 'react';
import { scenarioError } from '../../i18n/scenario';
import type { SquadRequest } from './squadCalculations';

/** Cancel previous work and never expose a response for an older scenario. */
export function useSquadCalculation<T>(request: SquadRequest, active: boolean) {
  const key = JSON.stringify(request);
  const [state, setState] = useState<{ key: string; result?: T; error?: string }>();
  const available = typeof Worker !== 'undefined';
  useEffect(() => {
    if (!active || !available) return;
    let live = true;
    let worker: Worker | undefined;
    const timer = setTimeout(() => {
      try {
        worker = new Worker(new URL('./squadWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = event => {
          if (live) setState({ key, result: event.data.result,
            error: event.data.error ? scenarioError(new Error(event.data.error)) : undefined });
          worker?.terminate();
        };
        worker.onerror = () => { if (live) setState({ key, error: scenarioError(new Error('SQUAD_COMPLEXITY_LIMIT')) }); worker?.terminate(); };
        worker.postMessage(JSON.parse(key));
      } catch { if (live) setState({ key, error: scenarioError(new Error('SQUAD_COMPLEXITY_LIMIT')) }); worker?.terminate(); }
    }, 80);
    return () => { live = false; clearTimeout(timer); worker?.terminate(); };
  }, [key, active, available]);
  return { available, pending: active && available && state?.key !== key,
    result: state?.key === key ? state.result : undefined, error: state?.key === key ? state.error : undefined };
}
