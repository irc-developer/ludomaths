import { IProfileRepository, StoredUnitProfile } from '@application/profiles/IProfileRepository';
import { LoadProfilesUseCase } from './LoadProfilesUseCase';
import { UnitProfile } from '@domain/profiles/unitProfile';

function makeStored(name: string, id: string, createdAt: number): StoredUnitProfile {
  const profile: UnitProfile = {
    name,
    wounds: 5,
    toughness: 3,
    weaponGroups: [],
    savePools: [{ baseSave: 4, fraction: 1 }],
  };
  return { ...profile, id, createdAt };
}

function makeRepo(): jest.Mocked<IProfileRepository> {
  return {
    findAll:  jest.fn(),
    findById: jest.fn(),
    save:     jest.fn(),
    update:   jest.fn(),
    delete:   jest.fn(),
  };
}

describe('LoadProfilesUseCase', () => {
  let repo: jest.Mocked<IProfileRepository>;
  let useCase: LoadProfilesUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new LoadProfilesUseCase(repo);
  });

  describe('loadAll', () => {
    it('returns what repo.findAll() returns', async () => {
      const profiles = [
        makeStored('Alpha', 'id-1', 1000),
        makeStored('Beta',  'id-2', 2000),
      ];
      repo.findAll.mockResolvedValue(profiles);

      const result = await useCase.loadAll();

      expect(repo.findAll).toHaveBeenCalledTimes(1);
      expect(result).toBe(profiles);
    });

    it('returns an empty array when there are no stored profiles', async () => {
      repo.findAll.mockResolvedValue([]);
      const result = await useCase.loadAll();
      expect(result).toEqual([]);
    });
  });

  describe('loadById', () => {
    it('returns the profile when id exists', async () => {
      const stored = makeStored('Scouts', 'id-3', 3000);
      repo.findById.mockResolvedValue(stored);

      const result = await useCase.loadById('id-3');

      expect(repo.findById).toHaveBeenCalledWith('id-3');
      expect(result).toBe(stored);
    });

    it('returns null when id does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      const result = await useCase.loadById('ghost');
      expect(result).toBeNull();
    });
  });
});
