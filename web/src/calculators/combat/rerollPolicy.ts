import type { DieRerollPolicy } from '@domain/dice/combat';
import type { CombatParams } from './presets';

export type RerollStage = 'hit' | 'wound';
export type RerollSelection = 'failures' | 'nonSixes';

/** A single effective policy, including defensive handling of conflicting inputs. */
export function resolveRerollPolicy(
  failures = false,
  nonSixes = false,
  disabled = false,
): DieRerollPolicy {
  if (disabled) return 'none';
  if (nonSixes) return 'nonSixes';
  return failures ? 'failures' : 'none';
}

/** Update both controls for one stage atomically without changing the other stage. */
export function updateRerollSelection(
  params: CombatParams,
  stage: RerollStage,
  selection: RerollSelection,
  checked: boolean,
): CombatParams {
  const failuresKey = stage === 'hit' ? 'hitRerollAll' : 'woundRerollAll';
  const nonSixesKey = stage === 'hit' ? 'hitRerollNonSixes' : 'woundRerollNonSixes';
  const selectedKey = selection === 'failures' ? failuresKey : nonSixesKey;
  const alternativeKey = selection === 'failures' ? nonSixesKey : failuresKey;
  return { ...params, [selectedKey]: checked, ...(checked ? { [alternativeKey]: false } : {}) };
}
