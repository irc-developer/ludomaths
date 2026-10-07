import { resolveCatalogScenario, type CatalogSelection } from './catalogScenario';
import { syntheticCatalog, syntheticTrust } from '@domain/profiles/catalogFixture';
import { validateCatalog, type ProfileCatalog, type CatalogRule, type CatalogValue } from '@domain/profiles/catalog';

const id = (prefix: string, digit = '2') => prefix + '_' + digit.repeat(24);
const fixed = (n: number): CatalogValue => ({ raw: String(n), normalized: { kind: 'fixed', value: n }, status: 'parsed' });
const threshold = (n: number): CatalogValue => ({ raw: n + '+', normalized: n, status: 'parsed' });
const base = { attacks: 1, hitThreshold: 3, strength: 4, ap: 0, damage: 1, toughness: 4, targetWounds: 2, baseSave: 3 };
function setup() {
  const catalog: ProfileCatalog = validateCatalog(syntheticCatalog(), syntheticTrust);
  const unit = catalog.units[0]; const miniature = catalog.miniatures[0];
  catalog.weapons.push({ id: id('w'), name: 'Synthetic weapon', modeIds: [id('wm')], ruleIds: [] });
  catalog.equipmentChoices.push({ id: id('eq'), unitId: unit.id, miniatureId: miniature.id, kind: 'default', weaponIds: [id('w')], min: 1, max: 1, allowDuplicates: false, conditionRuleIds: [] });
  unit.equipmentChoiceIds.push(id('eq'));
  catalog.weaponModes.push({ id: id('wm'), weaponId: id('w'), name: 'Synthetic mode', type: 'ranged',
    range: { raw: '24"', normalized: { kind: 'inches', value: 24 }, status: 'parsed' },
    characteristics: { attacks: fixed(2), ballisticSkill: threshold(3), weaponSkill: { raw: null, normalized: null, status: 'not-applicable' },
      strength: fixed(5), armourPenetration: { raw: '-1', normalized: 1, status: 'parsed' }, damage: fixed(2) },
    targetCondition: { state: 'not-applicable', match: null, keywordIds: [], ruleIds: [] }, ruleIds: [] });
  const selection: CatalogSelection = { catalogId: catalog.catalogId, catalogVersion: catalog.catalogVersion, payloadSha256: catalog.payloadSha256,
    attackerUnitId: unit.id, attackerMiniatureId: miniature.id, modeId: id('wm'), defenderUnitId: unit.id, defenderMiniatureId: miniature.id };
  return { catalog, selection };
}
const rule = (capabilityId: string, digit: string): CatalogRule => ({ id: id('r', digit), name: 'Synthetic rule', description: 'Synthetic effect',
  reviewState: 'reviewed', reviewVersion: '1.0.0', capabilityId, parameters: {}, requiredContext: [] });

describe('catalog effect binding', () => {
  it('does not leak manual abilities or defensive saves into a new selected profile', () => {
    const { catalog, selection } = setup();
    const review = resolveCatalogScenario(catalog, selection, { ...base, fnpThreshold: 2, invulnerableSave: 2, torrent: true, sustainedHits: 4 });
    expect(review.params.torrent).toBe(false);
    expect(review.params.sustainedHits).toBeUndefined();
    expect(review.params.invulnerableSave).toBeUndefined();
    expect(review.params.fnpThreshold).toBeUndefined();
    expect(review.params.damageExpression).toBe('2');
  });
  it('does not infer Torrent from a dash or from a rule name', () => {
    const { catalog, selection } = setup();
    catalog.weaponModes[0].characteristics.ballisticSkill = { raw: '-', normalized: null, status: 'unsupported' };
    expect(() => resolveCatalogScenario(catalog, selection, base)).toThrow();
    catalog.rules.push(rule('torrent', '3')); catalog.weaponModes[0].ruleIds.push(id('r', '3'));
    expect(resolveCatalogScenario(catalog, selection, base).params.torrent).toBe(true);
  });
  it('keeps reviewed but unsupported effects pending on the relevant side', () => {
    const { catalog, selection } = setup();
    catalog.rules.push(rule('hitBonus', '3'), rule('riledUp', '4'));
    catalog.units[0].ruleIds.push(id('r', '3'), id('r', '4'));
    const offense = resolveCatalogScenario(catalog, { ...selection, defenderMiniatureId: undefined }, base);
    expect(offense.pending.map(r => r.capabilityId)).toEqual(['hitBonus']);
    const defense = resolveCatalogScenario(catalog, { ...selection, modeId: undefined }, base);
    expect(defense.pending.map(r => r.capabilityId)).toEqual(['riledUp']);
  });
  it('rejects an ineligible Hunter target and expired selection', () => {
    const { catalog, selection } = setup();
    catalog.weaponModes[0].targetCondition = { state: 'reviewed', match: 'any', keywordIds: [id('k')], ruleIds: [] };
    expect(() => resolveCatalogScenario(catalog, selection, base)).toThrow('CATALOG_TARGET_NOT_ELIGIBLE');
    expect(() => resolveCatalogScenario(catalog, { ...selection, catalogVersion: 'old' }, base)).toThrow('CATALOG_SELECTION_EXPIRED');
  });
});
