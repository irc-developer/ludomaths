import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoadProfilesUseCase } from '@application/profiles/LoadProfilesUseCase';
import { DeleteProfileUseCase } from '@application/profiles/DeleteProfileUseCase';
import type { IProfileRepository, StoredUnitProfile } from '@application/profiles/IProfileRepository';
import { profileRepository } from '@infrastructure/storage/repositoryInstances';

export interface UseProfilesResult {
  profiles: StoredUnitProfile[];
  loading: boolean;
  error: string | null;
  deleteProfile: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useProfiles(repo: IProfileRepository = profileRepository): UseProfilesResult {
  const [profiles, setProfiles] = useState<StoredUnitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loader = useMemo(() => new LoadProfilesUseCase(repo), [repo]);
  const deleter = useMemo(() => new DeleteProfileUseCase(repo), [repo]);

  const reload = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setProfiles(await loader.loadAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const deleteProfile = useCallback(
    async (id: string): Promise<void> => {
      await deleter.execute(id);
      await reload();
    },
    [deleter, reload],
  );

  return { profiles, loading, error, deleteProfile, reload };
}
