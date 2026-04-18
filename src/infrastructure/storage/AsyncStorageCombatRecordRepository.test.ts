import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageCombatRecordRepository } from './AsyncStorageCombatRecordRepository';
import { StoredCombatRecord } from '@application/combat/ICombatRecordRepository';
import { CombatRecord } from '@domain/combat/combatRecord';
import { UnitProfile } from '@domain/profiles/unitProfile';

function makeAttacker(): UnitProfile {
  return {
    name: 'Intercessors',
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

function makeDefender(): UnitProfile {
  return {
    name: 'Guardia Imperial',
    wounds: 10,
    toughness: 3,
    weaponGroups: [],
    savePools: [{ baseSave: 5, fraction: 1 }],
  };
}

function makeRecord(label = 'Test'): CombatRecord {
  return { label, attacker: makeAttacker(), defender: makeDefender() };
}

const repo = new AsyncStorageCombatRecordRepository();

beforeEach(() => {
  (AsyncStorage as any).__resetStore();
});

describe('AsyncStorageCombatRecordRepository', () => {
  describe('save', () => {
    it('returns a StoredCombatRecord with id and createdAt', async () => {
      const stored = await repo.save(makeRecord('Battle 1'));
      expect(stored.id).toBeTruthy();
      expect(stored.createdAt).toBeGreaterThan(0);
      expect(stored.label).toBe('Battle 1');
    });

    it('assigns distinct ids to distinct records', async () => {
      const a = await repo.save(makeRecord('A'));
      const b = await repo.save(makeRecord('B'));
      expect(a.id).not.toBe(b.id);
    });

    it('preserves attacker and defender snapshots', async () => {
      const record = makeRecord();
      const stored = await repo.save(record);
      expect(stored.attacker).toEqual(record.attacker);
      expect(stored.defender).toEqual(record.defender);
    });
  });

  describe('findAll', () => {
    it('returns empty array when storage is empty', async () => {
      expect(await repo.findAll()).toEqual([]);
    });

    it('returns all saved records ordered by createdAt ascending', async () => {
      const a = await repo.save(makeRecord('First'));
      const b = await repo.save(makeRecord('Second'));
      const all = await repo.findAll();
      expect(all[0].id).toBe(a.id);
      expect(all[1].id).toBe(b.id);
    });
  });

  describe('findById', () => {
    it('returns the correct record', async () => {
      const stored = await repo.save(makeRecord('Solo'));
      const found  = await repo.findById(stored.id);
      expect(found).not.toBeNull();
      expect(found!.label).toBe('Solo');
    });

    it('returns null for unknown id', async () => {
      expect(await repo.findById('ghost')).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes the record from storage', async () => {
      const stored = await repo.save(makeRecord('ToDelete'));
      await repo.delete(stored.id);
      expect(await repo.findById(stored.id)).toBeNull();
    });

    it('reduces findAll count by 1', async () => {
      await repo.save(makeRecord('Keep'));
      const del = await repo.save(makeRecord('Remove'));
      await repo.delete(del.id);
      expect(await repo.findAll()).toHaveLength(1);
    });

    it('throws for non-existent id', async () => {
      await expect(repo.delete('ghost')).rejects.toThrow();
    });
  });

  describe('isolation from profile store', () => {
    it('uses a different storage key than the profile repository', async () => {
      await repo.save(makeRecord('R1'));
      const keys = await AsyncStorage.getAllKeys();
      // Must not use the profile key
      expect(keys).not.toContain('@ludomaths/profiles');
      expect(keys).toContain('@ludomaths/combat-records');
    });
  });
});
