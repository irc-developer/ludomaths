import type { ProfileCatalog, CatalogMode } from '@domain/profiles/catalog';
import type { EquipmentReview } from '@domain/profiles/catalogEquipment';
import { syntheticCatalog, syntheticTrust } from '@domain/profiles/catalogFixture';
import { validateCatalog } from '@domain/profiles/catalog';
import type { CombatScenarioInput } from './combatScenario';

/** Synthetic equipment semantics; never a copy of a private package. */
export function equipmentFixture() {
  const catalog: ProfileCatalog = validateCatalog(syntheticCatalog(), syntheticTrust);
  const unit = catalog.units[0], miniature = catalog.miniatures[0];
  miniature.id = 'ordinary'; miniature.name = 'Ordinary model';
  catalog.miniatures.push({ ...miniature, id: 'sergeant', name: 'Sergeant' });
  unit.miniatureIds = ['ordinary', 'sergeant'];
  const fixed = (value: number) => ({ raw: String(value), normalized: { kind: 'fixed' as const, value }, status: 'parsed' as const });
  const mode = (id: string, weaponId: string, type: 'ranged' | 'melee' = 'ranged'): CatalogMode => ({ id, weaponId, name: id, type,
    range: { raw: '24"', normalized: { kind: 'inches', value: 24 }, status: 'parsed' },
    characteristics: { attacks: fixed(1), ballisticSkill: { raw: '3+', normalized: 3, status: 'parsed' },
      weaponSkill: { raw: '3+', normalized: 3, status: 'parsed' }, strength: fixed(4), armourPenetration: { raw: '0', normalized: 0, status: 'parsed' }, damage: fixed(1) },
    targetCondition: { state: 'not-applicable', match: null, keywordIds: [], ruleIds: [] }, ruleIds: [] });
  catalog.weaponModes = [mode('bolter-mode', 'bolter'), mode('krak', 'cyclone'), mode('frag', 'cyclone'), mode('flamer-mode', 'flamer'), mode('fist-mode', 'fist', 'melee')];
  catalog.weaponModes[1].characteristics = { ...catalog.weaponModes[1].characteristics, attacks: fixed(2), strength: fixed(6), damage: fixed(2) };
  catalog.weaponModes[3].characteristics = { ...catalog.weaponModes[3].characteristics,
    attacks: { raw: 'D3', normalized: { kind: 'dice', count: 1, sides: 3, modifier: 0 }, status: 'parsed' } };
  catalog.weapons = ['bolter', 'cyclone', 'flamer', 'fist'].map(id => ({ id, name: id, modeIds: catalog.weaponModes.filter(m => m.weaponId === id).map(m => m.id), ruleIds: [] }));
  catalog.equipmentChoices = ['ordinary', 'sergeant'].map(miniatureId => ({ id: 'default-' + miniatureId, unitId: unit.id, miniatureId,
    kind: 'default', weaponIds: miniatureId === 'ordinary' ? ['bolter', 'fist', 'cyclone', 'flamer'] : ['bolter', 'fist'], min: 1, max: 1, allowDuplicates: false, conditionRuleIds: [] }));
  catalog.compositions = [{ id: 'ten', unitId: unit.id, isDefault: true, members: [{ miniatureId: 'ordinary', min: 9, max: 9 }, { miniatureId: 'sergeant', min: 1, max: 1 }], conditionRuleIds: [] }];
  const review: EquipmentReview = { id: 'synthetic-equipment-1', catalogId: catalog.catalogId, catalogVersion: catalog.catalogVersion, payloadSha256: catalog.payloadSha256,
    unitId: unit.id, ordinaryId: 'ordinary', sergeantId: 'sergeant', defaultWeaponIds: ['bolter', 'fist'],
    defaultModeIds: { bolter: 'bolter-mode', cyclone: 'krak', flamer: 'flamer-mode', fist: 'fist-mode' },
    options: [{ id: 'cyclone', choiceId: 'default-ordinary', weaponIds: ['bolter', 'cyclone'], replacesWeaponId: 'bolter' },
      { id: 'flamer', choiceId: 'default-ordinary', weaponIds: ['flamer'], replacesWeaponId: 'bolter' }], modelsPerSpecial: 5 };
  const base: CombatScenarioInput = { attacks: 1, hitThreshold: 3, strength: 4, ap: 0, damage: 1, toughness: 4, targetWounds: 2, baseSave: 3,
    modelCount: 10, targetModelCount: 2, catalogSelection: { catalogId: catalog.catalogId, catalogVersion: catalog.catalogVersion, payloadSha256: catalog.payloadSha256,
      attackerUnitId: unit.id, attackerMiniatureId: 'ordinary', attackerCompositionId: 'ten', defenderUnitId: unit.id, defenderMiniatureId: 'ordinary' } };
  return { catalog, review, base };
}
