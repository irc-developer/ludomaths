import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoadCombatRecordsUseCase } from '@application/combat/LoadCombatRecordsUseCase';
import { DeleteCombatRecordUseCase } from '@application/combat/DeleteCombatRecordUseCase';
import type { ICombatRecordRepository, StoredCombatRecord } from '@application/combat/ICombatRecordRepository';
import { combatRecordRepository } from '@infrastructure/storage/repositoryInstances';

export interface UseHistoryResult {
  records: StoredCombatRecord[];
  loading: boolean;
  error: string | null;
  deleteRecord: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useHistory(
  repo: ICombatRecordRepository = combatRecordRepository,
): UseHistoryResult {
  const [records, setRecords] = useState<StoredCombatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loader = useMemo(() => new LoadCombatRecordsUseCase(repo), [repo]);
  const deleter = useMemo(() => new DeleteCombatRecordUseCase(repo), [repo]);

  const reload = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setRecords(await loader.loadAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => { void reload(); }, [reload]);

  const deleteRecord = useCallback(
    async (id: string): Promise<void> => {
      await deleter.execute(id);
      await reload();
    },
    [deleter, reload],
  );

  return { records, loading, error, deleteRecord, reload };
}
