import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

interface Operation { kind: 'get' | 'put'; commit: () => void; abort: () => void }
let saved: unknown;
let operations: Operation[];
let storage: typeof import('./catalogStorage');

beforeEach(async () => {
  vi.resetModules();
  saved = undefined;
  operations = [];
  vi.stubGlobal('indexedDB', {
    open: () => {
      const opening = {} as IDBOpenDBRequest;
      const db = {
        close: vi.fn(),
        transaction: () => {
          const tx = {} as IDBTransaction;
          const enqueue = (kind: Operation['kind'], value?: unknown) => {
            const request = {} as IDBRequest;
            operations.push({ kind,
              commit: () => {
                if (kind === 'put') saved = value;
                Object.assign(request, { result: kind === 'get' ? saved : 'current' });
                tx.oncomplete?.({} as Event);
              },
              abort: () => { tx.onabort?.({} as Event); },
            });
            return request;
          };
          Object.assign(tx, { objectStore: () => ({ get: () => enqueue('get'), put: (value: unknown) => enqueue('put', value) }) });
          return tx;
        },
      };
      Object.assign(opening, { result: db });
      queueMicrotask(() => opening.onsuccess?.({} as Event));
      return opening;
    },
  });
  storage = await import('./catalogStorage');
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('browser catalog repository', () => {
  it('waits for transaction commit, serializes replacement/removal and preserves the removal marker', async () => {
    const first = storage.writeStoredCatalog('synthetic');
    const removal = storage.writeStoredCatalog(null);
    await waitFor(() => expect(operations).toHaveLength(1));
    expect(saved).toBeUndefined();
    operations[0].commit();
    await first;
    await waitFor(() => expect(operations).toHaveLength(2));
    operations[1].commit();
    await removal;
    const read = storage.readStoredCatalog();
    await waitFor(() => expect(operations).toHaveLength(3));
    operations[2].commit();
    expect(await read).toEqual({ version: 1, text: null });
  });
  it('keeps the previous persisted catalog after an aborted write and allows the next write', async () => {
    saved = { version: 1, text: 'previous' };
    const failure = storage.writeStoredCatalog('replacement');
    const assertion = expect(failure).rejects.toThrow('CATALOG_STORAGE_UNAVAILABLE');
    await waitFor(() => expect(operations).toHaveLength(1));
    operations[0].abort();
    await assertion;
    expect(saved).toEqual({ version: 1, text: 'previous' });
    const next = storage.writeStoredCatalog(null);
    await waitFor(() => expect(operations).toHaveLength(2));
    operations[1].commit();
    await next;
    expect(saved).toEqual({ version: 1, text: null });
  });
  it('distinguishes a browser with no saved catalog from explicit removal', async () => {
    const read = storage.readStoredCatalog();
    await waitFor(() => expect(operations).toHaveLength(1));
    operations[0].commit();
    expect(await read).toBeUndefined();
  });
  it.each([{ version: 2, text: 'secret' }, { version: 1, text: 42 }, { version: 1, text: 'secret', extra: 'private' }])(
    'rejects invalid persistence envelopes without leaking their contents', async value => {
      saved = value;
      const read = storage.readStoredCatalog();
      const assertion = expect(read).rejects.toThrow('CATALOG_STORAGE_INVALID');
      await waitFor(() => expect(operations).toHaveLength(1));
      operations[0].commit();
      await assertion;
    });
  it('fails neutrally when browser storage is disabled', async () => {
    vi.stubGlobal('indexedDB', { open: () => { throw new Error('private browser error'); } });
    await expect(storage.readStoredCatalog()).rejects.toThrow('CATALOG_STORAGE_UNAVAILABLE');
    await expect(storage.writeStoredCatalog('synthetic')).rejects.toThrow('CATALOG_STORAGE_UNAVAILABLE');
  });
});
