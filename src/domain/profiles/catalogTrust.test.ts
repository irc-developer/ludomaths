import { hasCatalogUpgrade, isCatalogUpgrade, type TrustedCatalog } from './catalogTrust';

const previous = { catalogId: 'synthetic', catalogVersion: 'first', payloadSha256: 'old' };
const next = { ...previous, catalogVersion: 'second', payloadSha256: 'new' };
const registry: readonly TrustedCatalog[] = [{ ...next, factionIds: [], replaces: ['old'] }];

describe('explicit catalog upgrades', () => {
  it('accepts only a registered successor of the same catalog family', () => {
    expect(hasCatalogUpgrade(previous, registry)).toBe(true);
    expect(isCatalogUpgrade(previous, next, registry)).toBe(true);
    expect(isCatalogUpgrade(previous, { ...next, payloadSha256: 'unknown' }, registry)).toBe(false);
    expect(isCatalogUpgrade(previous, { ...next, catalogId: 'other' }, registry)).toBe(false);
    expect(isCatalogUpgrade(next, previous, registry)).toBe(false);
    expect(hasCatalogUpgrade(next, registry)).toBe(false);
  });
});
