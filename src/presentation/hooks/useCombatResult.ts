import { useState, useMemo, useCallback } from 'react';
import { CalculateRoundsToKillUseCase } from '@application/dice/CalculateRoundsToKillUseCase';
import { SaveCombatRecordUseCase } from '@application/combat/SaveCombatRecordUseCase';
import type { RoundsToKillResult } from '@application/dice/CalculateRoundsToKillUseCase';
import type { ICombatRecordRepository } from '@application/combat/ICombatRecordRepository';
import type { StoredUnitProfile } from '@application/profiles/IProfileRepository';
import type { UnitProfile } from '@domain/profiles/unitProfile';
import { combatRecordRepository } from '@infrastructure/storage/repositoryInstances';

const MAX_ROUNDS = 20;

export interface CombatResultInput {
  /** UnitProfile or StoredUnitProfile — only the game data is needed for calculation. */
  attacker: UnitProfile | null;
  /** UnitProfile or StoredUnitProfile — only the game data is needed for calculation. */
  defender: UnitProfile | null;
}

export interface UseCombatResultReturn {
  /** Null when attacker/defender not set or attacker has no weapons. */
  result: RoundsToKillResult | null;
  saving: boolean;
  saveError: string | null;
  /** Id of the saved record, or null if not yet saved. */
  savedId: string | null;
  saveRecord: (label: string) => Promise<void>;
}

export function useCombatResult(
  input: CombatResultInput,
  repo: ICombatRecordRepository = combatRecordRepository,
): UseCombatResultReturn {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const roundsUseCase = useMemo(() => new CalculateRoundsToKillUseCase(), []);
  const saveUseCase = useMemo(() => new SaveCombatRecordUseCase(repo), [repo]);

  const { attacker, defender } = input;

  const result = useMemo<RoundsToKillResult | null>(() => {
    if (attacker == null || defender == null) return null;
    if (attacker.weaponGroups.length === 0) return null;
    return roundsUseCase.execute({
      weaponGroups: attacker.weaponGroups,
      toughness: defender.toughness,
      savePools: defender.savePools,
      targetWounds: defender.wounds,
      maxRounds: MAX_ROUNDS,
    });
  }, [attacker, defender, roundsUseCase]);

  const saveRecord = useCallback(
    async (label: string): Promise<void> => {
      if (attacker == null || defender == null) return;
      setSaving(true);
      setSaveError(null);
      try {
        const stored = await saveUseCase.execute({ label, attacker, defender });
        setSavedId(stored.id);
      } catch (e: unknown) {
        setSaveError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setSaving(false);
      }
    },
    [attacker, defender, saveUseCase],
  );

  return { result, saving, saveError, savedId, saveRecord };
}
