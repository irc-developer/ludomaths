/**
 * @module IProfileRepository
 *
 * Port (interface) for persisting and retrieving UnitProfiles.
 *
 * Lives in application/ because it defines the contract the use cases need.
 * The concrete implementation lives in infrastructure/storage/ and is injected
 * via dependency inversion — use cases depend on this interface, not on
 * AsyncStorage directly.
 *
 * StoredUnitProfile extends UnitProfile with persistence metadata (id,
 * createdAt) that the domain does not know or care about.
 */

import { UnitProfile } from '@domain/profiles/unitProfile';

/** A UnitProfile enriched with storage metadata. */
export interface StoredUnitProfile extends UnitProfile {
  /** Unique identifier assigned at creation. */
  id: string;
  /** Unix timestamp (ms) of when the profile was first saved. */
  createdAt: number;
}

export interface IProfileRepository {
  /** Returns all stored profiles, ordered by createdAt ascending. */
  findAll(): Promise<StoredUnitProfile[]>;
  /** Returns the profile with the given id, or null if not found. */
  findById(id: string): Promise<StoredUnitProfile | null>;
  /** Persists a new profile and returns it with id and createdAt populated. */
  save(profile: UnitProfile): Promise<StoredUnitProfile>;
  /**
   * Replaces the data of an existing profile.
   * @throws {Error} If no profile with the given id exists.
   */
  update(id: string, profile: UnitProfile): Promise<StoredUnitProfile>;
  /**
   * Deletes a profile by id.
   * @throws {Error} If no profile with the given id exists.
   */
  delete(id: string): Promise<void>;
}
