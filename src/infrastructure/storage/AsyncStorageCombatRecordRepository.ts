/**
 * @module AsyncStorageCombatRecordRepository
 *
 * Concrete implementation of ICombatRecordRepository backed by AsyncStorage.
 *
 * Shared storage primitives (generateId, readAll, writeAll, findAll,
 * findById, delete) are inherited from JSONStorageRepository. Only the
 * entity-specific write operation (save) lives here.
 */

import { ICombatRecordRepository, StoredCombatRecord } from '@application/combat/ICombatRecordRepository';
import { CombatRecord } from '@domain/combat/combatRecord';
import { JSONStorageRepository } from './JSONStorageRepository';

export class AsyncStorageCombatRecordRepository
  extends JSONStorageRepository<StoredCombatRecord>
  implements ICombatRecordRepository {

  protected readonly storageKey = '@ludomaths/combat-records';
  protected readonly entityName = 'AsyncStorageCombatRecordRepository';

  async save(record: CombatRecord): Promise<StoredCombatRecord> {
    const records = await this.readAll();
    const stored: StoredCombatRecord = {
      ...record,
      id: this.generateId(),
      createdAt: Date.now(),
    };
    records.push(stored);
    await this.writeAll(records);
    return stored;
  }
}
