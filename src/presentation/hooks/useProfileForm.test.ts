import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProfileForm } from './useProfileForm';
import type { IProfileRepository, StoredUnitProfile } from '@application/profiles/IProfileRepository';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStored(overrides: Partial<StoredUnitProfile> = {}): StoredUnitProfile {
  return {
    id: 'id-1',
    createdAt: 1000,
    name: 'Space Marines',
    wounds: 10,
    toughness: 4,
    savePools: [{ baseSave: 3, fraction: 1, invulnerableSave: 4, fnpThreshold: 6 }],
    weaponGroups: [
      {
        attacksDist: [{ value: 2, probability: 1 }],
        hitThreshold: 3,
        strengthDist: [{ value: 4, probability: 1 }],
        ap: 1,
        damageDist: [{ value: 1, probability: 1 }],
        modelCount: 5,
      },
    ],
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IProfileRepository> = {}): IProfileRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(makeStored()),
    save: jest.fn().mockResolvedValue(makeStored()),
    update: jest.fn().mockResolvedValue(makeStored()),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Create mode ───────────────────────────────────────────────────────────────

describe('useProfileForm — create mode', () => {
  it('initializes with empty fields and step 0', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    expect(result.current.step).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.fields.name).toBe('');
    expect(result.current.fields.weapons).toHaveLength(0);
  });

  it('updateField changes a field value', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => { result.current.updateField('name', 'Orks'); });
    expect(result.current.fields.name).toBe('Orks');
  });

  it('addWeapon appends a default weapon row', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => { result.current.addWeapon(); });
    expect(result.current.fields.weapons).toHaveLength(1);
    expect(result.current.fields.weapons[0].attacks).toBe('1');
  });

  it('removeWeapon removes by index', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => { result.current.addWeapon(); result.current.addWeapon(); });
    act(() => { result.current.removeWeapon(0); });
    expect(result.current.fields.weapons).toHaveLength(1);
  });

  it('updateWeapon updates a specific weapon row field', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => { result.current.addWeapon(); });
    act(() => { result.current.updateWeapon(0, 'attacks', '3'); });
    expect(result.current.fields.weapons[0].attacks).toBe('3');
  });

  it('nextStep does not advance when name is empty', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => { result.current.nextStep(); });
    expect(result.current.step).toBe(0);
    expect(result.current.error).not.toBeNull();
  });

  it('nextStep advances to step 1 when step 0 fields are valid', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => {
      result.current.updateField('name', 'Marines');
      result.current.updateField('wounds', '10');
      result.current.updateField('toughness', '4');
      result.current.updateField('baseSave', '3');
    });
    act(() => { result.current.nextStep(); });
    expect(result.current.step).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('nextStep does not advance beyond step 2', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => {
      result.current.updateField('name', 'Marines');
      result.current.updateField('wounds', '10');
      result.current.updateField('toughness', '4');
      result.current.updateField('baseSave', '3');
    });
    act(() => { result.current.nextStep(); }); // 0 → 1
    act(() => { result.current.nextStep(); }); // 1 → 2
    act(() => { result.current.nextStep(); }); // stays at 2
    expect(result.current.step).toBe(2);
  });

  it('prevStep goes from step 1 back to step 0', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => {
      result.current.updateField('name', 'Marines');
      result.current.updateField('wounds', '10');
      result.current.updateField('toughness', '4');
      result.current.updateField('baseSave', '3');
    });
    act(() => { result.current.nextStep(); });
    act(() => { result.current.prevStep(); });
    expect(result.current.step).toBe(0);
  });

  it('prevStep does not go below step 0', () => {
    const { result } = renderHook(() => useProfileForm(undefined, makeRepo()));
    act(() => { result.current.prevStep(); });
    expect(result.current.step).toBe(0);
  });

  it('save calls SaveProfileUseCase with the correct UnitProfile', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useProfileForm(undefined, repo));
    act(() => {
      result.current.updateField('name', 'Marines');
      result.current.updateField('wounds', '10');
      result.current.updateField('toughness', '4');
      result.current.updateField('baseSave', '3');
    });
    let success: boolean | undefined;
    await act(async () => { success = await result.current.save(); });
    expect(success).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Marines', wounds: 10, toughness: 4 }),
    );
  });

  it('save builds the correct SavePool from form fields', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useProfileForm(undefined, repo));
    act(() => {
      result.current.updateField('name', 'Terminators');
      result.current.updateField('wounds', '2');
      result.current.updateField('toughness', '5');
      result.current.updateField('baseSave', '2');
      result.current.updateField('invulnSave', '4');
      result.current.updateField('fnpThreshold', '6');
    });
    await act(async () => { await result.current.save(); });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        savePools: [{ baseSave: 2, fraction: 1, invulnerableSave: 4, fnpThreshold: 6 }],
      }),
    );
  });

  it('save builds weapon groups correctly', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useProfileForm(undefined, repo));
    act(() => {
      result.current.updateField('name', 'Marines');
      result.current.updateField('wounds', '10');
      result.current.updateField('toughness', '4');
      result.current.updateField('baseSave', '3');
      result.current.addWeapon();
    });
    act(() => {
      result.current.updateWeapon(0, 'attacks', '2');
      result.current.updateWeapon(0, 'strength', '5');
      result.current.updateWeapon(0, 'ap', '1');
      result.current.updateWeapon(0, 'damage', '2');
      result.current.updateWeapon(0, 'modelCount', '5');
    });
    await act(async () => { await result.current.save(); });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        weaponGroups: [
          expect.objectContaining({
            attacksDist: [{ value: 2, probability: 1 }],
            hitThreshold: 3,
            strengthDist: [{ value: 5, probability: 1 }],
            ap: 1,
            damageDist: [{ value: 2, probability: 1 }],
            modelCount: 5,
          }),
        ],
      }),
    );
  });

  it('save returns false and sets error when use case throws', async () => {
    const repo = makeRepo({ save: jest.fn().mockRejectedValue(new Error('storage full')) });
    const { result } = renderHook(() => useProfileForm(undefined, repo));
    act(() => {
      result.current.updateField('name', 'Marines');
      result.current.updateField('wounds', '10');
      result.current.updateField('toughness', '4');
      result.current.updateField('baseSave', '3');
    });
    let success: boolean | undefined;
    await act(async () => { success = await result.current.save(); });
    expect(success).toBe(false);
    expect(result.current.error).toBe('storage full');
  });
});

// ── Edit mode ─────────────────────────────────────────────────────────────────

describe('useProfileForm — edit mode', () => {
  it('starts in loading state and populates fields from existing profile', async () => {
    const stored = makeStored();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(stored) });
    const { result } = renderHook(() => useProfileForm('id-1', repo));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fields.name).toBe('Space Marines');
    expect(result.current.fields.wounds).toBe('10');
    expect(result.current.fields.toughness).toBe('4');
    expect(result.current.fields.baseSave).toBe('3');
    expect(result.current.fields.invulnSave).toBe('4');
    expect(result.current.fields.fnpThreshold).toBe('6');
    expect(result.current.fields.weapons).toHaveLength(1);
    expect(result.current.fields.weapons[0].attacks).toBe('2');
    expect(result.current.fields.weapons[0].modelCount).toBe('5');
  });

  it('sets error when loadById fails', async () => {
    const repo = makeRepo({ findById: jest.fn().mockRejectedValue(new Error('not found')) });
    const { result } = renderHook(() => useProfileForm('id-1', repo));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('not found');
  });

  it('save calls UpdateProfileUseCase with the profileId', async () => {
    const stored = makeStored();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(stored) });
    const { result } = renderHook(() => useProfileForm('id-1', repo));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.save(); });
    expect(repo.update).toHaveBeenCalledWith('id-1', expect.objectContaining({ name: 'Space Marines' }));
    expect(repo.save).not.toHaveBeenCalled();
  });
});
