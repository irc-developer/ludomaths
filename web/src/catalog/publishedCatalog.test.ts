import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPublishedCatalog } from './publishedCatalog';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('published catalog bootstrap', () => {
  it('loads the combined pilot in production using the configured Pages base path', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('BASE_URL', '/ludomaths/');
    const fetch = vi.fn().mockResolvedValue(new Response('synthetic catalog'));
    vi.stubGlobal('fetch', fetch);
    expect(await readPublishedCatalog()).toBe('synthetic catalog');
    expect(fetch).toHaveBeenCalledWith('/ludomaths/catalogs/pilot-combined.json', { cache: 'no-cache', credentials: 'omit' });
  });
  it('allows an absent catalog and rejects server failures without echoing their content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('internal details', { status: 503 })));
    expect(await readPublishedCatalog()).toBeUndefined();
    await expect(readPublishedCatalog()).rejects.toThrow('CATALOG_INVALID');
  });
});
