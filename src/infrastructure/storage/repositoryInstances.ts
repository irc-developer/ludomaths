/**
 * @module repositoryInstances
 *
 * Singleton repository instances for production use.
 *
 * Hooks and screens import these as default values for their `repo` parameter,
 * keeping the concrete AsyncStorage dependency out of the hook body while
 * still allowing tests to inject mock repositories freely.
 */

import { AsyncStorageProfileRepository } from './AsyncStorageProfileRepository';
import { AsyncStorageCombatRecordRepository } from './AsyncStorageCombatRecordRepository';

export const profileRepository = new AsyncStorageProfileRepository();
export const combatRecordRepository = new AsyncStorageCombatRecordRepository();
