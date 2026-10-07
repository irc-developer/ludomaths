import { afterEach, describe, expect, it, vi } from 'vitest';
import { readLocalCatalog } from './localCatalog';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('optional local seed', () => {
  it('never requests a private endpoint in a production build', async () => {
    vi.stubEnv('DEV', false);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await readLocalCatalog()).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('loads without sending cookies or caching and respects the application base', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('BASE_URL', '/ludomaths/');
    const fetch = vi.fn().mockResolvedValue(new Response('synthetic'));
    vi.stubGlobal('fetch', fetch);
    expect(await readLocalCatalog()).toBe('synthetic');
    expect(fetch).toHaveBeenCalledWith('/ludomaths/.__private/catalog', { cache: 'no-store', credentials: 'omit' });
  });
  it('allows manual use without a configured seed and rejects failures neutrally', async () => {
    vi.stubEnv('DEV', true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('private server error', { status: 503 })));
    expect(await readLocalCatalog()).toBeUndefined();
    await expect(readLocalCatalog()).rejects.toThrow('CATALOG_INVALID');
  });
});
