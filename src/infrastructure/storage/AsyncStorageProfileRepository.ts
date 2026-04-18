/**
 * @module AsyncStorageProfileRepository
 *
 * Concrete implementation of IProfileRepository backed by AsyncStorage.
 *
 * All profiles are stored as a single JSON-serialised array under one key.
 * This is appropriate for the expected data volume in a mobile gaming app
 * (tens of profiles at most). For larger datasets a per-key + index approach
 * would be more efficient.
 *
 * Shared storage primitives (generateId, readAll, writeAll, findAll,
 * findById, delete) are inherited from JSONStorageRepository. Only the
 * entity-specific write operations (save, update) live here.
 */

import { IProfileRepository, StoredUnitProfile } from '@application/profiles/IProfileRepository';
import { UnitProfile } from '@domain/profiles/unitProfile';
import { JSONStorageRepository } from './JSONStorageRepository';

export class AsyncStorageProfileRepository
  extends JSONStorageRepository<StoredUnitProfile>
  implements IProfileRepository {

  protected readonly storageKey = '@ludomaths/profiles';
  protected readonly entityName = 'AsyncStorageProfileRepository';

  async save(profile: UnitProfile): Promise<StoredUnitProfile> {
    const profiles = await this.readAll();
    const stored: StoredUnitProfile = {
      ...profile,
      id: this.generateId(),
      createdAt: Date.now(),
    };
    profiles.push(stored);
    await this.writeAll(profiles);
    return stored;
  }

  async update(id: string, profile: UnitProfile): Promise<StoredUnitProfile> {
    const profiles = await this.readAll();
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`${this.entityName}: no entity found with id "${id}"`);
    }
    const updated: StoredUnitProfile = {
      ...profile,
      id,
      createdAt: profiles[index].createdAt,
    };
    profiles[index] = updated;
    await this.writeAll(profiles);
    return updated;
  }
}
