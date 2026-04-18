import { ICombatRecordRepository, StoredCombatRecord } from './ICombatRecordRepository';
import { CombatRecord, validateCombatRecord } from '@domain/combat/combatRecord';

export class SaveCombatRecordUseCase {
  constructor(private readonly repo: ICombatRecordRepository) {}

  async execute(record: CombatRecord): Promise<StoredCombatRecord> {
    validateCombatRecord(record);
    return this.repo.save(record);
  }
}
