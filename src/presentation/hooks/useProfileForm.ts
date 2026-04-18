import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoadProfilesUseCase } from '@application/profiles/LoadProfilesUseCase';
import { SaveProfileUseCase } from '@application/profiles/SaveProfileUseCase';
import { UpdateProfileUseCase } from '@application/profiles/UpdateProfileUseCase';
import type { IProfileRepository } from '@application/profiles/IProfileRepository';
import { profileRepository } from '@infrastructure/storage/repositoryInstances';
import {
  EMPTY_FIELDS,
  DEFAULT_WEAPON,
  profileToFields,
  fieldsToProfile,
  validateStep0,
} from './profileFormConversion';
import type { WeaponFormRow, ProfileFormFields } from './profileFormConversion';

// Re-exported so screens that import these types from useProfileForm continue
// to work without changing their import paths.
export type { WeaponFormRow, ProfileFormFields } from './profileFormConversion';

export type ProfileFormStep = 0 | 1 | 2;

export interface UseProfileFormResult {
  step: ProfileFormStep;
  fields: ProfileFormFields;
  loading: boolean;
  error: string | null;
  updateField: (key: keyof Omit<ProfileFormFields, 'weapons'>, value: string) => void;
  updateWeapon: (idx: number, key: keyof WeaponFormRow, value: string) => void;
  addWeapon: () => void;
  removeWeapon: (idx: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  /** Persists the profile. Returns true on success, false on error. */
  save: () => Promise<boolean>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProfileForm(
  profileId: string | undefined,
  repo: IProfileRepository = profileRepository,
): UseProfileFormResult {
  const [step, setStep] = useState<ProfileFormStep>(0);
  const [fields, setFields] = useState<ProfileFormFields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(profileId != null);
  const [error, setError] = useState<string | null>(null);

  const loader = useMemo(() => new LoadProfilesUseCase(repo), [repo]);
  const saver = useMemo(() => new SaveProfileUseCase(repo), [repo]);
  const updater = useMemo(() => new UpdateProfileUseCase(repo), [repo]);

  // In edit mode, load the existing profile once on mount.
  useEffect(() => {
    if (profileId == null) return;
    setLoading(true);
    loader
      .loadById(profileId)
      .then(stored => {
        if (stored != null) setFields(profileToFields(stored));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [profileId, loader]);

  const updateField = useCallback(
    (key: keyof Omit<ProfileFormFields, 'weapons'>, value: string) => {
      setFields(f => ({ ...f, [key]: value }));
      setError(null);
    },
    [],
  );

  const updateWeapon = useCallback(
    (idx: number, key: keyof WeaponFormRow, value: string) => {
      setFields(f => ({
        ...f,
        weapons: f.weapons.map((w, i) => (i === idx ? { ...w, [key]: value } : w)),
      }));
    },
    [],
  );

  const addWeapon = useCallback(() => {
    setFields(f => ({ ...f, weapons: [...f.weapons, { ...DEFAULT_WEAPON }] }));
  }, []);

  const removeWeapon = useCallback((idx: number) => {
    setFields(f => ({ ...f, weapons: f.weapons.filter((_, i) => i !== idx) }));
  }, []);

  const nextStep = useCallback(() => {
    if (step === 0) {
      const err = validateStep0(fields);
      if (err != null) { setError(err); return; }
    }
    setError(null);
    setStep(s => (s < 2 ? ((s + 1) as ProfileFormStep) : s));
  }, [step, fields]);

  const prevStep = useCallback(() => {
    setError(null);
    setStep(s => (s > 0 ? ((s - 1) as ProfileFormStep) : s));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    const err = validateStep0(fields);
    if (err != null) { setError(err); return false; }
    setLoading(true);
    setError(null);
    try {
      const profile = fieldsToProfile(fields);
      if (profileId != null) {
        await updater.execute(profileId, profile);
      } else {
        await saver.execute(profile);
      }
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fields, profileId, saver, updater]);

  return { step, fields, loading, error, updateField, updateWeapon, addWeapon, removeWeapon, nextStep, prevStep, save };
}
