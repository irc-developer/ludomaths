import { IProfileRepository, StoredUnitProfile } from '@application/profiles/IProfileRepository';
import { SaveProfileUseCase } from './SaveProfileUseCase';
import { UnitProfile } from '@domain/profiles/unitProfile';

function makeProfile(overrides: Partial<UnitProfile> = {}): UnitProfile {
  return {
    name: 'Intercessors',
    wounds: 10,
    toughness: 4,
    weaponGroups: [],
    savePools: [{ baseSave: 3, fraction: 1 }],
    ...overrides,
  };
}

function makeStored(profile: UnitProfile): StoredUnitProfile {
  return { ...profile, id: 'id-1', createdAt: 1000 };
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

describe('SaveProfileUseCase', () => {
  let repo: jest.Mocked<IProfileRepository>;
  let useCase: SaveProfileUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new SaveProfileUseCase(repo);
  });

  it('calls repo.save() with the profile and returns its result', async () => {
    const profile = makeProfile();
    const stored  = makeStored(profile);
    repo.save.mockResolvedValue(stored);

    const result = await useCase.execute(profile);

    expect(repo.save).toHaveBeenCalledWith(profile);
    expect(result).toBe(stored);
  });

  it('does not call repo.save() when validation fails', async () => {
    await expect(useCase.execute(makeProfile({ name: '' }))).rejects.toThrow(RangeError);
    expect(repo.save).not.toHaveBeenCalled();
  });

  describe('validation', () => {
    it('throws RangeError for empty name', async () => {
      await expect(useCase.execute(makeProfile({ name: '' }))).rejects.toThrow(RangeError);
    });

    it('throws RangeError for wounds = 0', async () => {
      await expect(useCase.execute(makeProfile({ wounds: 0 }))).rejects.toThrow(RangeError);
    });

    it('throws RangeError for toughness = 0', async () => {
      await expect(useCase.execute(makeProfile({ toughness: 0 }))).rejects.toThrow(RangeError);
    });

    it('throws RangeError for empty savePools', async () => {
      await expect(useCase.execute(makeProfile({ savePools: [] }))).rejects.toThrow(RangeError);
    });

    it('throws RangeError when savePool fractions do not sum to 1', async () => {
      await expect(
        useCase.execute(makeProfile({ savePools: [{ baseSave: 3, fraction: 0.6 }] })),
      ).rejects.toThrow(RangeError);
    });
  });
});
