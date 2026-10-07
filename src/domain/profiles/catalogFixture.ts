import type { TrustedCatalog } from './catalogTrust';
const id = (prefix: string) => prefix + '_' + '1'.repeat(24);
export const syntheticTrust: TrustedCatalog[] = [{ catalogId: id('lm'), catalogVersion: 'test-1',
  payloadSha256: 'a'.repeat(64), factionIds: [id('f')] }];
/** Synthetic identities and characteristics only; never a private catalog snapshot. */
export function syntheticCatalog() {
  const value = (raw: string, normalized: number) => ({ raw, normalized, status: 'parsed' });
  return { format: 'ludomaths-profile-catalog', schemaVersion: '2.0.0', edition: '11',
    catalogId: id('lm'), catalogVersion: 'test-1', payloadSha256: 'a'.repeat(64),
    generatedAt: '2026-10-07T00:00:00Z', capabilityReviewVersion: 'lm-pilot-1',
    scope: { factionIds: [id('f')], profile: 'standard', eligibility: 'direct', coverage: 'pilot', selectedUnitIds: [id('u')] },
    factions: [{ id: id('f'), name: 'Synthetic faction', parentId: null }],
    units: [{ id: id('u'), name: 'Synthetic unit', factionIds: [id('f')], miniatureIds: [id('m')], compositionIds: [], equipmentChoiceIds: [], ruleIds: [] }],
    miniatures: [{ id: id('m'), unitId: id('u'), name: 'Synthetic miniature',
      characteristics: { toughness: value('4', 4), save: value('3+', 3), woundsMax: value('2', 2) },
      keywordIds: [], invulnerableSaves: [], ruleIds: [] }],
    weapons: [], weaponModes: [], keywords: [], compositions: [], equipmentChoices: [], rules: [], relations: [], issues: [], coverage: [],
  };
}
