import { applyCatalogComposition } from './catalogComposition';
import { validateCatalog } from '@domain/profiles/catalog';
import { syntheticCatalog, syntheticTrust } from '@domain/profiles/catalogFixture';
const base = { attacks: 2, hitThreshold: 3, strength: 4, ap: 0, damage: 1, toughness: 4, targetWounds: 2, baseSave: 3 };
describe('catalog composition suggestions', () => {
  it('applies a known composition and leaves current survivors editable', () => {
    const catalog = validateCatalog(syntheticCatalog(), syntheticTrust);
    catalog.compositions.push({ id: 'c_test', unitId: catalog.units[0].id, isDefault: true,
      members: [{ miniatureId: catalog.miniatures[0].id, min: 5, max: 10 }], conditionRuleIds: [] });
    const params = { ...base, catalogSelection: { catalogId: catalog.catalogId, catalogVersion: catalog.catalogVersion,
      payloadSha256: catalog.payloadSha256, defenderUnitId: catalog.units[0].id, defenderMiniatureId: catalog.miniatures[0].id } };
    const result = applyCatalogComposition(catalog, params, 'defender', 'c_test');
    expect(result.targetModelCount).toBe(5);
    expect(result.targetWounds).toBe(2);
    expect(result.woundsMax).toBe(2);
    expect(result.modelCount).toBeUndefined();
    catalog.compositions[0].conditionRuleIds = ['pending_condition'];
    expect(() => applyCatalogComposition(catalog, params, 'defender', 'c_test')).toThrow('CATALOG_COMPOSITION_UNSUPPORTED');
  });
  it('keeps distinct defensive members and preserves the attacking squad', () => {
    const catalog = validateCatalog(syntheticCatalog(), syntheticTrust);
    const primary = catalog.miniatures[0];
    const alternate = { ...primary, id: 'm_alternate', name: 'Synthetic alternate', characteristics: {
      ...primary.characteristics, woundsMax: { raw: '3', normalized: 3, status: 'parsed' as const },
    } };
    catalog.miniatures.push(alternate);
    catalog.compositions.push({ id: 'c_mixed', unitId: catalog.units[0].id, isDefault: true,
      members: [{ miniatureId: primary.id, min: 4, max: 9 }, { miniatureId: alternate.id, min: 1, max: 1 }], conditionRuleIds: [] });
    const params = { ...base, modelCount: 10, catalogSelection: { catalogId: catalog.catalogId, catalogVersion: catalog.catalogVersion,
      payloadSha256: catalog.payloadSha256, defenderUnitId: catalog.units[0].id, defenderMiniatureId: primary.id } };
    const result = applyCatalogComposition(catalog, params, 'defender', 'c_mixed');
    expect(result.modelCount).toBe(10);
    expect(result.targetModelCount).toBe(5);
    expect(result.defenderGroups).toHaveLength(1);
    expect(result.defenderGroups![0].count).toBe(1);
    expect(result.defenderGroups![0].profile.woundsMax).toBe(3);
    expect(result.defenderGroups![0].profile.targetWounds).toBe(3);
  });
});
