import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHistory } from './useHistory';
import type { ICombatRecordRepository, StoredCombatRecord } from '@application/combat/ICombatRecordRepository';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const unitStub = {
  id: 'u1', createdAt: 0,
  name: 'Marines', wounds: 10, toughness: 4,
  savePools: [{ baseSave: 3, fraction: 1 }],
  weaponGroups: [],
};

const rec1: StoredCombatRecord = {
  id: 'r1', createdAt: 1000, label: 'Alpha', attacker: unitStub, defender: unitStub,
};
const rec2: StoredCombatRecord = {
  id: 'r2', createdAt: 2000, label: 'Beta', attacker: unitStub, defender: unitStub,
};

function makeRepo(overrides: Partial<ICombatRecordRepository> = {}): ICombatRecordRepository {
  return {
    findAll: jest.fn().mockResolvedValue([rec1, rec2]),
    findById: jest.fn().mockResolvedValue(rec1),
    save: jest.fn().mockResolvedValue(rec1),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useHistory', () => {
  it('starts loading then resolves with all records', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useHistory(repo));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.records).toEqual([rec1, rec2]);
    expect(result.current.error).toBeNull();
  });

  it('exposes an error when findAll rejects', async () => {
    const repo = makeRepo({ findAll: jest.fn().mockRejectedValue(new Error('io error')) });
    const { result } = renderHook(() => useHistory(repo));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('io error');
    expect(result.current.records).toEqual([]);
  });

  it('deleteRecord removes the record and reloads', async () => {
    const findAll = jest.fn()
      .mockResolvedValueOnce([rec1, rec2])
      .mockResolvedValue([rec2]); // mockResolvedValue (no Once): seguro ante re-renders extra
    const repo = makeRepo({ findAll });

    const { result } = renderHook(() => useHistory(repo));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.deleteRecord('r1'); });

    expect(repo.delete).toHaveBeenCalledWith('r1');
    expect(result.current.records).toEqual([rec2]);
  });

  it('reload re-fetches the list', async () => {
    const findAll = jest.fn()
      .mockResolvedValueOnce([rec1])
      .mockResolvedValue([rec1, rec2]);
    const repo = makeRepo({ findAll });

    const { result } = renderHook(() => useHistory(repo));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.reload(); });

    expect(result.current.records).toEqual([rec1, rec2]);
  });
});
