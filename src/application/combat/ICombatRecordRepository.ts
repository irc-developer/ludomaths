/**
 * @module ICombatRecordRepository
 *
 * Port for persisting and retrieving CombatRecords.
 * Follows the same pattern as IProfileRepository.
 */

import { CombatRecord } from '@domain/combat/combatRecord';

export interface StoredCombatRecord extends CombatRecord {
  id: string;
  createdAt: number;
}

export interface ICombatRecordRepository {
  findAll(): Promise<StoredCombatRecord[]>;
  findById(id: string): Promise<StoredCombatRecord | null>;
  save(record: CombatRecord): Promise<StoredCombatRecord>;
  delete(id: string): Promise<void>;
}
