import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCombatResult } from './useCombatResult';
import type { StoredUnitProfile } from '@application/profiles/IProfileRepository';
import type { ICombatRecordRepository, StoredCombatRecord } from '@application/combat/ICombatRecordRepository';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const attacker: StoredUnitProfile = {
  id: 'atk-1',
  createdAt: 1000,
  name: 'Marines',
  wounds: 10,
  toughness: 4,
  savePools: [{ baseSave: 3, fraction: 1 }],
  weaponGroups: [
    {
      attacksDist: [{ value: 3, probability: 1 }],
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      ap: 1,
      damageDist: [{ value: 1, probability: 1 }],
      modelCount: 5,
    },
  ],
};

const defender: StoredUnitProfile = {
  id: 'def-1',
  createdAt: 2000,
  name: 'Orks',
  wounds: 1,
  toughness: 5,
  savePools: [{ baseSave: 6, fraction: 1 }],
  weaponGroups: [],
};

const storedRecord: StoredCombatRecord = {
  id: 'rec-1',
  createdAt: 3000,
  label: 'Test combat',
  attacker,
  defender,
};

function makeRepo(overrides: Partial<ICombatRecordRepository> = {}): ICombatRecordRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(storedRecord),
    save: jest.fn().mockResolvedValue(storedRecord),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useCombatResult', () => {
  it('computes result synchronously from attacker and defender', () => {
    const { result } = renderHook(() =>
      useCombatResult({ attacker, defender }, makeRepo()),
    );
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.expectedRounds).toBeGreaterThan(0);
    expect(result.current.result?.killByRound.length).toBeGreaterThan(0);
    expect(result.current.saving).toBe(false);
    expect(result.current.saveError).toBeNull();
  });

  it('returns null result when attacker or defender is null', () => {
    const { result } = renderHook(() =>
      useCombatResult({ attacker: null, defender }, makeRepo()),
    );
    expect(result.current.result).toBeNull();
  });

  it('returns null result when attacker has no weapon groups', () => {
    const noWeapons: StoredUnitProfile = { ...attacker, weaponGroups: [] };
    const { result } = renderHook(() =>
      useCombatResult({ attacker: noWeapons, defender }, makeRepo()),
    );
    expect(result.current.result).toBeNull();
  });

  it('saveRecord persists a CombatRecord and sets savedId', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() =>
      useCombatResult({ attacker, defender }, repo),
    );
    await act(async () => {
      await result.current.saveRecord('Test combat');
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Test combat',
        attacker,
        defender,
      }),
    );
    expect(result.current.savedId).toBe('rec-1');
  });

  it('saveRecord sets saveError when repo rejects', async () => {
    const repo = makeRepo({ save: jest.fn().mockRejectedValue(new Error('disk full')) });
    const { result } = renderHook(() =>
      useCombatResult({ attacker, defender }, repo),
    );
    await act(async () => {
      await result.current.saveRecord('oops');
    });
    expect(result.current.saveError).toBe('disk full');
    expect(result.current.savedId).toBeNull();
  });

  it('saveRecord does nothing when attacker or defender is null', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() =>
      useCombatResult({ attacker: null, defender }, repo),
    );
    await act(async () => {
      await result.current.saveRecord('label');
    });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('recomputes result when inputs change', () => {
    const otherDefender: StoredUnitProfile = {
      ...defender,
      wounds: 20,
      toughness: 8,
    };
    const { result, rerender } = renderHook(
      ({ def }: { def: StoredUnitProfile }) =>
        useCombatResult({ attacker, defender: def }, makeRepo()),
      { initialProps: { def: defender } },
    );
    const first = result.current.result?.expectedRounds;
    rerender({ def: otherDefender });
    const second = result.current.result?.expectedRounds;
    expect(second).toBeGreaterThan(first!);
  });
});
