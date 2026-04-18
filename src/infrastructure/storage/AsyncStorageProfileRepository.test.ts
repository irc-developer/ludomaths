import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageProfileRepository } from './AsyncStorageProfileRepository';
import { StoredUnitProfile } from '@application/profiles/IProfileRepository';
import { UnitProfile } from '@domain/profiles/unitProfile';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Minimal valid UnitProfile for tests. */
function makeProfile(name: string): UnitProfile {
  return {
    name,
    wounds: 10,
    toughness: 4,
    weaponGroups: [{
      attacksDist:  [{ value: 2, probability: 1 }],
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      ap:           0,
      damageDist:   [{ value: 1, probability: 1 }],
      modelCount:   5,
    }],
    savePools: [{ baseSave: 3, fraction: 1 }],
  };
}

const repo = new AsyncStorageProfileRepository();

beforeEach(() => {
  // Reset the in-memory store and mock call counts between tests.
  (AsyncStorage as any).__resetStore();
});

// ── save ───────────────────────────────────────────────────────────────────

describe('save', () => {
  it('returns a StoredUnitProfile with id and createdAt populated', async () => {
    const stored = await repo.save(makeProfile('Intercessors'));
    expect(stored.id).toBeTruthy();
    expect(typeof stored.id).toBe('string');
    expect(stored.createdAt).toBeGreaterThan(0);
    expect(stored.name).toBe('Intercessors');
  });

  it('assigns distinct ids to distinct profiles', async () => {
    const a = await repo.save(makeProfile('A'));
    const b = await repo.save(makeProfile('B'));
    expect(a.id).not.toBe(b.id);
  });

  it('persists the profile so findAll returns it', async () => {
    await repo.save(makeProfile('Scouts'));
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Scouts');
  });

  it('preserves weapon groups and save pools', async () => {
    const profile = makeProfile('GuardUnit');
    const stored = await repo.save(profile);
    expect(stored.weaponGroups).toEqual(profile.weaponGroups);
    expect(stored.savePools).toEqual(profile.savePools);
  });
});

// ── findAll ────────────────────────────────────────────────────────────────

describe('findAll', () => {
  it('returns empty array when storage is empty', async () => {
    const all = await repo.findAll();
    expect(all).toEqual([]);
  });

  it('returns all saved profiles', async () => {
    await repo.save(makeProfile('Alpha'));
    await repo.save(makeProfile('Beta'));
    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it('returns profiles ordered by createdAt ascending', async () => {
    const a = await repo.save(makeProfile('First'));
    const b = await repo.save(makeProfile('Second'));
    const all = await repo.findAll();
    expect(all[0].id).toBe(a.id);
    expect(all[1].id).toBe(b.id);
  });
});

// ── findById ───────────────────────────────────────────────────────────────

describe('findById', () => {
  it('returns the correct profile by id', async () => {
    const stored = await repo.save(makeProfile('Terminators'));
    const found = await repo.findById(stored.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Terminators');
  });

  it('returns null when id does not exist', async () => {
    const found = await repo.findById('non-existent-id');
    expect(found).toBeNull();
  });

  it('does not confuse profiles with similar ids', async () => {
    const a = await repo.save(makeProfile('UnitA'));
    const b = await repo.save(makeProfile('UnitB'));
    expect((await repo.findById(a.id))!.name).toBe('UnitA');
    expect((await repo.findById(b.id))!.name).toBe('UnitB');
  });
});

// ── update ────────────────────────────────────────────────────────────────

describe('update', () => {
  it('updates the name of an existing profile', async () => {
    const stored = await repo.save(makeProfile('OldName'));
    const updated = await repo.update(stored.id, { ...makeProfile('NewName') });
    expect(updated.name).toBe('NewName');
    expect(updated.id).toBe(stored.id);
    expect(updated.createdAt).toBe(stored.createdAt);
  });

  it('persists the update so findById reflects the new data', async () => {
    const stored = await repo.save(makeProfile('Original'));
    await repo.update(stored.id, makeProfile('Modified'));
    const found = await repo.findById(stored.id);
    expect(found!.name).toBe('Modified');
  });

  it('throws when updating a non-existent id', async () => {
    await expect(repo.update('ghost-id', makeProfile('X'))).rejects.toThrow();
  });

  it('does not alter other profiles when one is updated', async () => {
    const a = await repo.save(makeProfile('A'));
    const b = await repo.save(makeProfile('B'));
    await repo.update(a.id, makeProfile('A-updated'));
    const found = await repo.findById(b.id);
    expect(found!.name).toBe('B');
  });
});

// ── delete ────────────────────────────────────────────────────────────────

describe('delete', () => {
  it('removes the profile from storage', async () => {
    const stored = await repo.save(makeProfile('ToDelete'));
    await repo.delete(stored.id);
    const found = await repo.findById(stored.id);
    expect(found).toBeNull();
  });

  it('reduces findAll count by 1', async () => {
    await repo.save(makeProfile('Keep'));
    const del = await repo.save(makeProfile('Remove'));
    await repo.delete(del.id);
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Keep');
  });

  it('throws when deleting a non-existent id', async () => {
    await expect(repo.delete('ghost-id')).rejects.toThrow();
  });
});

// ── persistence across instances ─────────────────────────────────────────

describe('persistence across instances', () => {
  it('data saved by one instance is visible to another sharing the same mock store', async () => {
    await repo.save(makeProfile('Shared'));
    const repo2 = new AsyncStorageProfileRepository();
    const all = await repo2.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Shared');
  });
});
