import { ICombatRecordRepository } from './ICombatRecordRepository';

export class DeleteCombatRecordUseCase {
  constructor(private readonly repo: ICombatRecordRepository) {}

  async execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
