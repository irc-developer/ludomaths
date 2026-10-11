import { useEffect, useState } from 'react';
import { scenarioError } from '../../i18n/scenario';
import type { SquadRequest } from './squadCalculations';
import { useReportExecution } from './ReportExecution';

/** Cancel previous work and never expose a response for an older scenario. */
export function useSquadCalculation<T>(request: SquadRequest, active: boolean) {
  const key = JSON.stringify(request);
  const cache = useReportExecution()?.cache;
  const cached = cache?.get(`worker:${key}`) as T | undefined;
  const [state, setState] = useState<{ key: string; result?: T; error?: string }>();
  const available = typeof Worker !== 'undefined';
  useEffect(() => {
    if (!active || !available || cached) return;
    let live = true;
    let worker: Worker | undefined;
    const timer = setTimeout(() => {
      try {
        worker = new Worker(new URL('./squadWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = event => {
          if (live && !event.data.error && event.data.result) cache?.set(`worker:${key}`, event.data.result);
          if (live) setState({ key, result: event.data.result,
            error: event.data.error ? scenarioError(new Error(event.data.error)) : undefined });
          worker?.terminate();
        };
        worker.onerror = () => { if (live) setState({ key, error: scenarioError(new Error('SQUAD_COMPLEXITY_LIMIT')) }); worker?.terminate(); };
        worker.postMessage(JSON.parse(key));
      } catch { if (live) setState({ key, error: scenarioError(new Error('SQUAD_COMPLEXITY_LIMIT')) }); worker?.terminate(); }
    }, 80);
    return () => { live = false; clearTimeout(timer); worker?.terminate(); };
  }, [key, active, available, cache, cached]);
  return { available, pending: active && available && !cached && state?.key !== key,
    result: cached ?? (state?.key === key ? state.result : undefined), error: cached ? undefined : state?.key === key ? state.error : undefined };
}
