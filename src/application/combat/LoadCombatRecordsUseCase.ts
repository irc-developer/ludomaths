import { ICombatRecordRepository, StoredCombatRecord } from './ICombatRecordRepository';

export class LoadCombatRecordsUseCase {
  constructor(private readonly repo: ICombatRecordRepository) {}

  async loadAll(): Promise<StoredCombatRecord[]> {
    return this.repo.findAll();
  }

  async loadById(id: string): Promise<StoredCombatRecord | null> {
    return this.repo.findById(id);
  }
}
