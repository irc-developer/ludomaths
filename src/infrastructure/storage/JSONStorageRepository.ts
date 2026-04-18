/**
 * @module JSONStorageRepository
 *
 * Abstract base class for AsyncStorage-backed repositories that persist
 * a single JSON-serialised array under one fixed storage key.
 *
 * Type parameter TStored must carry at least `id: string` and
 * `createdAt: number` so that the shared operations (findAll sorted by
 * creation order, findById, delete) can be expressed generically.
 *
 * Concrete subclasses must declare:
 *  - `storageKey`  — the AsyncStorage key for this entity type.
 *  - `entityName`  — used in error messages to identify the repository.
 *  - `save()`      — entity-specific insert logic (shapes differ per domain).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export abstract class JSONStorageRepository<TStored extends { id: string; createdAt: number }> {
  protected abstract readonly storageKey: string;
  protected abstract readonly entityName: string;

  // ── Primitive helpers ───────────────────────────────────────────────────

  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  protected async readAll(): Promise<TStored[]> {
    const raw = await AsyncStorage.getItem(this.storageKey);
    if (raw === null) return [];
    return JSON.parse(raw) as TStored[];
  }

  protected async writeAll(items: TStored[]): Promise<void> {
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  // ── Shared read operations ──────────────────────────────────────────────

  async findAll(): Promise<TStored[]> {
    const items = await this.readAll();
    return items.slice().sort((a, b) => a.createdAt - b.createdAt);
  }

  async findById(id: string): Promise<TStored | null> {
    const items = await this.readAll();
    return items.find(item => item.id === id) ?? null;
  }

  // ── Shared write operation ──────────────────────────────────────────────

  async delete(id: string): Promise<void> {
    const items = await this.readAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`${this.entityName}: no entity found with id "${id}"`);
    }
    items.splice(index, 1);
    await this.writeAll(items);
  }
}
