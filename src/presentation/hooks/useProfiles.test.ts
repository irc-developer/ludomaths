import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProfiles } from './useProfiles';
import type { IProfileRepository, StoredUnitProfile } from '@application/profiles/IProfileRepository';
import type { UnitProfile } from '@domain/profiles/unitProfile';

// ── Helpers ──────────────────────────────────────────────────────────────────

const sampleProfile: UnitProfile = {
  name: 'Space Marines',
  wounds: 2,
  toughness: 4,
  savePools: [{ baseSave: 3, fraction: 1 }],
  weaponGroups: [],
};

const stored1: StoredUnitProfile = { ...sampleProfile, id: 'id-1', createdAt: 1000 };
const stored2: StoredUnitProfile = { ...sampleProfile, name: 'Orks', id: 'id-2', createdAt: 2000 };

function makeRepo(overrides: Partial<IProfileRepository> = {}): IProfileRepository {
  return {
    findAll: jest.fn().mockResolvedValue([stored1, stored2]),
    findById: jest.fn().mockResolvedValue(stored1),
    save: jest.fn().mockResolvedValue(stored1),
    update: jest.fn().mockResolvedValue(stored1),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useProfiles', () => {
  it('starts in loading state, then resolves profiles', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useProfiles(repo));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profiles).toEqual([stored1, stored2]);
    expect(result.current.error).toBeNull();
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it('exposes an error message when loadAll rejects', async () => {
    const repo = makeRepo({ findAll: jest.fn().mockRejectedValue(new Error('disk full')) });
    const { result } = renderHook(() => useProfiles(repo));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('disk full');
    expect(result.current.profiles).toEqual([]);
  });

  it('deleteProfile removes the profile and reloads', async () => {
    const repoFindAll = jest.fn()
      .mockResolvedValueOnce([stored1, stored2])
      .mockResolvedValueOnce([stored2]);
    const repo = makeRepo({ findAll: repoFindAll });

    const { result } = renderHook(() => useProfiles(repo));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteProfile('id-1');
    });

    expect(repo.delete).toHaveBeenCalledWith('id-1');
    expect(result.current.profiles).toEqual([stored2]);
  });

  it('reload refreshes the profile list', async () => {
    const repoFindAll = jest.fn()
      .mockResolvedValueOnce([stored1])
      .mockResolvedValueOnce([stored1, stored2]);
    const repo = makeRepo({ findAll: repoFindAll });

    const { result } = renderHook(() => useProfiles(repo));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.profiles).toEqual([stored1, stored2]);
  });
});
