import { ICombatRecordRepository, StoredCombatRecord } from './ICombatRecordRepository';
import { SaveCombatRecordUseCase } from './SaveCombatRecordUseCase';
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
      ap: 0,
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

function makeRecord(overrides: Partial<CombatRecord> = {}): CombatRecord {
  return { label: 'Test record', attacker: makeAttacker(), defender: makeDefender(), ...overrides };
}

function makeStored(record: CombatRecord): StoredCombatRecord {
  return { ...record, id: 'id-1', createdAt: 1000 };
}

function makeRepo(): jest.Mocked<ICombatRecordRepository> {
  return { findAll: jest.fn(), findById: jest.fn(), save: jest.fn(), delete: jest.fn() };
}

describe('SaveCombatRecordUseCase', () => {
  let repo: jest.Mocked<ICombatRecordRepository>;
  let useCase: SaveCombatRecordUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new SaveCombatRecordUseCase(repo);
  });

  it('calls repo.save() with the record and returns its result', async () => {
    const record  = makeRecord();
    const stored  = makeStored(record);
    repo.save.mockResolvedValue(stored);

    const result = await useCase.execute(record);

    expect(repo.save).toHaveBeenCalledWith(record);
    expect(result).toBe(stored);
  });

  it('does not call repo.save() when validation fails', async () => {
    await expect(useCase.execute(makeRecord({ label: '' }))).rejects.toThrow(RangeError);
    expect(repo.save).not.toHaveBeenCalled();
  });

  describe('validation', () => {
    it('throws RangeError for empty label', async () => {
      await expect(useCase.execute(makeRecord({ label: '' }))).rejects.toThrow(RangeError);
    });

    it('throws RangeError when attacker has no weapon groups', async () => {
      await expect(
        useCase.execute(makeRecord({ attacker: { ...makeAttacker(), weaponGroups: [] } })),
      ).rejects.toThrow(RangeError);
    });

    it('throws RangeError when defender toughness is 0', async () => {
      await expect(
        useCase.execute(makeRecord({ defender: { ...makeDefender(), toughness: 0 } })),
      ).rejects.toThrow(RangeError);
    });
  });
});
