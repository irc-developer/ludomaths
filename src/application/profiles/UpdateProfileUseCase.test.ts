import { IProfileRepository, StoredUnitProfile } from '@application/profiles/IProfileRepository';
import { UpdateProfileUseCase } from './UpdateProfileUseCase';
import { UnitProfile } from '@domain/profiles/unitProfile';

function makeProfile(overrides: Partial<UnitProfile> = {}): UnitProfile {
  return {
    name: 'Terminators',
    wounds: 20,
    toughness: 5,
    weaponGroups: [],
    savePools: [{ baseSave: 2, fraction: 1 }],
    ...overrides,
  };
}

function makeStored(profile: UnitProfile, id = 'id-1'): StoredUnitProfile {
  return { ...profile, id, createdAt: 1000 };
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

describe('UpdateProfileUseCase', () => {
  let repo: jest.Mocked<IProfileRepository>;
  let useCase: UpdateProfileUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateProfileUseCase(repo);
  });

  it('calls repo.update() with id and profile and returns its result', async () => {
    const profile = makeProfile();
    const stored  = makeStored(profile);
    repo.update.mockResolvedValue(stored);

    const result = await useCase.execute('id-1', profile);

    expect(repo.update).toHaveBeenCalledWith('id-1', profile);
    expect(result).toBe(stored);
  });

  it('does not call repo.update() when validation fails', async () => {
    await expect(useCase.execute('id-1', makeProfile({ wounds: 0 }))).rejects.toThrow(RangeError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('propagates the error from repo.update() for non-existent id', async () => {
    repo.update.mockRejectedValue(new Error('not found'));
    await expect(useCase.execute('ghost', makeProfile())).rejects.toThrow('not found');
  });

  describe('validation', () => {
    it('throws RangeError for empty name', async () => {
      await expect(useCase.execute('id-1', makeProfile({ name: '' }))).rejects.toThrow(RangeError);
    });

    it('throws RangeError for toughness = 0', async () => {
      await expect(useCase.execute('id-1', makeProfile({ toughness: 0 }))).rejects.toThrow(RangeError);
    });

    it('throws RangeError for empty savePools', async () => {
      await expect(useCase.execute('id-1', makeProfile({ savePools: [] }))).rejects.toThrow(RangeError);
    });
  });
});
