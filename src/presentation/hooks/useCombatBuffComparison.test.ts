import { renderHook } from '@testing-library/react-native';
import type { StoredUnitProfile } from '@application/profiles/IProfileRepository';
import { useCombatBuffComparison } from './useCombatBuffComparison';

const attacker: StoredUnitProfile = {
  id: 'atk-compare',
  createdAt: 1000,
  name: 'Sternguard',
  wounds: 10,
  toughness: 4,
  savePools: [{ baseSave: 3, fraction: 1 }],
  weaponGroups: [
    {
      attacksDist: [{ value: 4, probability: 1 }],
      hitThreshold: 4,
      strengthDist: [{ value: 6, probability: 1 }],
      ap: 1,
      damageDist: [{ value: 1, probability: 1 }],
      modelCount: 1,
    },
  ],
};

const defender: StoredUnitProfile = {
  id: 'def-compare',
  createdAt: 2000,
  name: 'Cultists',
  wounds: 10,
  toughness: 3,
  savePools: [{ baseSave: 6, fraction: 1 }],
  weaponGroups: [],
};

describe('useCombatBuffComparison', () => {
  it('returns a comparison when attacker and defender are present', () => {
    const { result } = renderHook(() =>
      useCombatBuffComparison({ attacker, defender }),
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.plusBallisticSkill.expectedDamage).toBeGreaterThan(
      result.current?.plusSave.expectedDamage ?? 0,
    );
  });

  it('returns null when one side is missing or attacker has no weapons', () => {
    const { result, rerender } = renderHook(
      ({ currentAttacker, currentDefender }: {
        currentAttacker: StoredUnitProfile | null;
        currentDefender: StoredUnitProfile | null;
      }) => useCombatBuffComparison({ attacker: currentAttacker, defender: currentDefender }),
      {
        initialProps: {
          currentAttacker: attacker,
          currentDefender: defender,
        },
      },
    );

    expect(result.current).not.toBeNull();

    rerender({ currentAttacker: null, currentDefender: defender });
    expect(result.current).toBeNull();

    rerender({
      currentAttacker: { ...attacker, weaponGroups: [] },
      currentDefender: defender,
    });
    expect(result.current).toBeNull();
  });
});