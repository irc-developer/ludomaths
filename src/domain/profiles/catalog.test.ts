import { validateCatalog, canonicalCatalog } from './catalog';
import { syntheticCatalog, syntheticTrust } from './catalogFixture';

describe('closed private catalog contract', () => {
  it('admits a clean synthetic reviewed selection', () => {
    expect(validateCatalog(syntheticCatalog(), syntheticTrust).units).toHaveLength(1);
  });
  it('rejects original metadata and unknown properties at every depth without echoing them', () => {
    const input = syntheticCatalog();
    Object.assign(input.miniatures[0].characteristics.toughness, { unexpectedMetadata: 'private-value' });
    expect(() => validateCatalog(input, syntheticTrust)).toThrow('CATALOG_INVALID');
  });
  it('rejects duplicate identities, dangling references and mismatched normalization', () => {
    const duplicate = syntheticCatalog();
    duplicate.units.push(duplicate.units[0]);
    expect(() => validateCatalog(duplicate, syntheticTrust)).toThrow();
    const dangling = syntheticCatalog();
    dangling.miniatures[0].unitId = 'u_' + '9'.repeat(24);
    expect(() => validateCatalog(dangling, syntheticTrust)).toThrow();
    const mismatch = syntheticCatalog();
    mismatch.miniatures[0].characteristics.toughness.normalized = 9;
    expect(() => validateCatalog(mismatch, syntheticTrust)).toThrow();
  });
  it('does not trust a reviewed assertion in an unknown catalog', () => {
    expect(() => validateCatalog(syntheticCatalog(), [])).toThrow();
  });
  it('canonicalizes only the clean payload and omits only its root digest', () => {
    expect(canonicalCatalog({ b: { payloadSha256: 'keep', a: 2 }, payloadSha256: 'omit', a: [2, 1] }))
      .toBe('{"a":[2,1],"b":{"a":2,"payloadSha256":"keep"}}');
  });
});
