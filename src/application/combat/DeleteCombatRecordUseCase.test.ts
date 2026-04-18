import { ICombatRecordRepository } from './ICombatRecordRepository';
import { DeleteCombatRecordUseCase } from './DeleteCombatRecordUseCase';

function makeRepo(): jest.Mocked<ICombatRecordRepository> {
  return { findAll: jest.fn(), findById: jest.fn(), save: jest.fn(), delete: jest.fn() };
}

describe('DeleteCombatRecordUseCase', () => {
  let repo: jest.Mocked<ICombatRecordRepository>;
  let useCase: DeleteCombatRecordUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteCombatRecordUseCase(repo);
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
