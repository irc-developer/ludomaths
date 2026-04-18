import { ICombatRecordRepository, StoredCombatRecord } from './ICombatRecordRepository';
import { LoadCombatRecordsUseCase } from './LoadCombatRecordsUseCase';
import { UnitProfile } from '@domain/profiles/unitProfile';
import { CombatRecord } from '@domain/combat/combatRecord';

function makeStored(label: string, id: string, createdAt: number): StoredCombatRecord {
  const attacker: UnitProfile = {
    name: 'A', wounds: 5, toughness: 4,
    weaponGroups: [{
      attacksDist: [{ value: 1, probability: 1 }], hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }], ap: 0,
      damageDist: [{ value: 1, probability: 1 }], modelCount: 1,
    }],
    savePools: [{ baseSave: 3, fraction: 1 }],
  };
  const defender: UnitProfile = {
    name: 'B', wounds: 5, toughness: 3,
    weaponGroups: [],
    savePools: [{ baseSave: 5, fraction: 1 }],
  };
  const record: CombatRecord = { label, attacker, defender };
  return { ...record, id, createdAt };
}

function makeRepo(): jest.Mocked<ICombatRecordRepository> {
  return { findAll: jest.fn(), findById: jest.fn(), save: jest.fn(), delete: jest.fn() };
}

describe('LoadCombatRecordsUseCase', () => {
  let repo: jest.Mocked<ICombatRecordRepository>;
  let useCase: LoadCombatRecordsUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new LoadCombatRecordsUseCase(repo);
  });

  describe('loadAll', () => {
    it('returns what repo.findAll() returns', async () => {
      const records = [makeStored('R1', 'id-1', 1000), makeStored('R2', 'id-2', 2000)];
      repo.findAll.mockResolvedValue(records);

      const result = await useCase.loadAll();

      expect(repo.findAll).toHaveBeenCalledTimes(1);
      expect(result).toBe(records);
    });

    it('returns an empty array when there are no stored records', async () => {
      repo.findAll.mockResolvedValue([]);
      expect(await useCase.loadAll()).toEqual([]);
    });
  });

  describe('loadById', () => {
    it('returns the record when id exists', async () => {
      const stored = makeStored('R1', 'id-1', 1000);
      repo.findById.mockResolvedValue(stored);

      const result = await useCase.loadById('id-1');

      expect(repo.findById).toHaveBeenCalledWith('id-1');
      expect(result).toBe(stored);
    });

    it('returns null when id does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      expect(await useCase.loadById('ghost')).toBeNull();
    });
  });
});
