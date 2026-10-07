/** Private payloads stay in this browser origin, outside history and shared scenarios. */
const DATABASE = 'ludomaths-private-catalog';
const STORE = 'catalog';
const KEY = 'current';

export interface StoredCatalog { version: 1; text: string | null }
let mutations: Promise<unknown> = Promise.resolve();

function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    let opening: IDBOpenDBRequest;
    let abandoned = false;
    try { opening = indexedDB.open(DATABASE, 1); } catch { reject(new Error('CATALOG_STORAGE_UNAVAILABLE')); return; }
    opening.onupgradeneeded = () => { opening.result.createObjectStore(STORE); };
    opening.onerror = () => reject(new Error('CATALOG_STORAGE_UNAVAILABLE'));
    opening.onblocked = () => { abandoned = true; reject(new Error('CATALOG_STORAGE_UNAVAILABLE')); };
    opening.onsuccess = () => {
      const db = opening.result;
      if (abandoned) { db.close(); return; }
      try {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => { db.close(); resolve(request.result); };
        tx.onabort = tx.onerror = () => { db.close(); reject(new Error('CATALOG_STORAGE_UNAVAILABLE')); };
      } catch { db.close(); reject(new Error('CATALOG_STORAGE_UNAVAILABLE')); }
    };
  });
}

export async function readStoredCatalog(): Promise<StoredCatalog | undefined> {
  await mutations.catch(() => {});
  const stored: unknown = await transaction('readonly', store => store.get(KEY));
  if (stored === undefined) return undefined;
  if (!stored || typeof stored !== 'object' || Object.keys(stored).length !== 2 ||
    !('version' in stored) || stored.version !== 1 || !('text' in stored) ||
    !(stored.text === null || typeof stored.text === 'string')) throw new Error('CATALOG_STORAGE_INVALID');
  return stored as StoredCatalog;
}

/** Serialize writes/removal so a slower import cannot undo a later removal. */
export function writeStoredCatalog(text: string | null): Promise<void> {
  const next = mutations.catch(() => {}).then(async () => {
    await transaction('readwrite', store => store.put({ version: 1, text } satisfies StoredCatalog, KEY));
  });
  mutations = next;
  return next;
}
