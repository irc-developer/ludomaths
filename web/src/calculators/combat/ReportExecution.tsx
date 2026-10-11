import { createContext, useContext, useMemo, type DependencyList, type ReactNode } from 'react';

type ReportCache = Map<string, unknown>;
const Execution = createContext<{ cache: ReportCache; retry: () => void; editObjective: () => void } | null>(null);
export function ReportExecutionProvider({ cache, retry, editObjective, children }: {
  cache: ReportCache; retry: () => void; editObjective: () => void; children: ReactNode;
}) {
  return <Execution.Provider value={{ cache, retry, editObjective }}>{children}</Execution.Provider>;
}
export const useReportExecution = () => useContext(Execution);

/** Keep a completed confirmed report while its draft is edited. Never cache failures or pending work. */
export function useReportCalculation<T extends { error?: string; isCalculating?: boolean }>(compute: () => T, dependencies: DependencyList, key: string): T {
  const execution = useReportExecution();
  return useMemo(() => {
    const cached = execution?.cache.get(`view:${key}`) as T | undefined;
    if (cached) return cached;
    const result = compute();
    if (!result.error && !result.isCalculating) execution?.cache.set(`view:${key}`, result);
    return result;
  }, [...dependencies, execution?.cache, key]);
}
