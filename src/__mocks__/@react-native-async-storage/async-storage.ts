/**
 * Manual Jest mock for @react-native-async-storage/async-storage.
 *
 * Uses an in-memory Map as the backing store so tests run without native
 * modules. The store is reset between tests via `__resetStore()`.
 */

const store = new Map<string, string>();

const AsyncStorage = {
  getItem: jest.fn(async (key: string): Promise<string | null> => {
    return store.get(key) ?? null;
  }),
  setItem: jest.fn(async (key: string, value: string): Promise<void> => {
    store.set(key, value);
  }),
  removeItem: jest.fn(async (key: string): Promise<void> => {
    store.delete(key);
  }),
  clear: jest.fn(async (): Promise<void> => {
    store.clear();
  }),
  getAllKeys: jest.fn(async (): Promise<readonly string[]> => {
    return Array.from(store.keys());
  }),
  /** Test helper — resets the in-memory store and all mock call counts. */
  __resetStore: () => {
    store.clear();
    Object.values(AsyncStorage).forEach(fn => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        (fn as jest.Mock).mockClear();
      }
    });
  },
};

export default AsyncStorage;
