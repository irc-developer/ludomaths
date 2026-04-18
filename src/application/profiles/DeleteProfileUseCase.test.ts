import { IProfileRepository } from '@application/profiles/IProfileRepository';
import { DeleteProfileUseCase } from './DeleteProfileUseCase';

function makeRepo(): jest.Mocked<IProfileRepository> {
  return {
    findAll:  jest.fn(),
    findById: jest.fn(),
    save:     jest.fn(),
    update:   jest.fn(),
    delete:   jest.fn(),
  };
}

describe('DeleteProfileUseCase', () => {
  let repo: jest.Mocked<IProfileRepository>;
  let useCase: DeleteProfileUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteProfileUseCase(repo);
  });

  it('calls repo.delete() with the given id', async () => {
    repo.delete.mockResolvedValue(undefined);
    await useCase.execute('id-1');
    expect(repo.delete).toHaveBeenCalledWith('id-1');
  });

  it('propagates the error from repo.delete() for non-existent id', async () => {
    repo.delete.mockRejectedValue(new Error('not found'));
    await expect(useCase.execute('ghost')).rejects.toThrow('not found');
  });
});
