import { describe, expect, it } from 'vitest';
import { syntheticCatalog, syntheticTrust } from '@domain/profiles/catalogFixture';
import { loadCatalog } from './loadCatalog';

describe('private file loader', () => {
  const options = { registry: syntheticTrust, digest: async () => 'a'.repeat(64) };
  it('accepts a coherent synthetic catalog', async () => {
    expect((await loadCatalog(JSON.stringify(syntheticCatalog()), options)).units).toHaveLength(1);
  });
  it('rejects changed digests and unknown data without exposing payloads', async () => {
    await expect(loadCatalog(JSON.stringify(syntheticCatalog()), { ...options, digest: async () => 'b'.repeat(64) })).rejects.toThrow('CATALOG_INVALID');
    await expect(loadCatalog('{"private":"secret"}', options)).rejects.toThrow('CATALOG_INVALID');
    await expect(loadCatalog('{"private":"secret"', options)).rejects.toThrow('CATALOG_INVALID');
  });
  it('rejects oversized inputs before invoking digest verification', async () => {
    await expect(loadCatalog(' '.repeat(10 * 1024 * 1024 + 1), options)).rejects.toThrow('CATALOG_INVALID');
  });
});
