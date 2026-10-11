/** Own catalog revisions and digests, independent of any external version. */
export interface TrustedCatalog { catalogId: string; catalogVersion: string; payloadSha256: string; factionIds: readonly string[]; replaces?: readonly string[] }
type CatalogIdentity = Pick<TrustedCatalog, 'catalogId' | 'catalogVersion' | 'payloadSha256'>;

/** Upgrades are explicit reviewed transitions, never inferred from version labels. */
export function hasCatalogUpgrade(previous: CatalogIdentity, registry: readonly TrustedCatalog[] = TRUSTED_CATALOGS): boolean {
  return registry.some(entry => entry.catalogId === previous.catalogId && entry.replaces?.includes(previous.payloadSha256));
}
export function isCatalogUpgrade(previous: CatalogIdentity, next: CatalogIdentity, registry: readonly TrustedCatalog[] = TRUSTED_CATALOGS): boolean {
  return previous.catalogId === next.catalogId && registry.some(entry => entry.catalogId === next.catalogId &&
    entry.catalogVersion === next.catalogVersion && entry.payloadSha256 === next.payloadSha256 && entry.replaces?.includes(previous.payloadSha256));
}
export const PILOT_FACTIONS = ["f_67225e1d3a000864ab07f63a","f_910e2f5f2a24c62ebb4b3308"] as const;
export const TRUSTED_CATALOGS: readonly TrustedCatalog[] = [
  {
    catalogId: 'lm_544087989f1020e6f671870a',
    catalogVersion: 'expanded-1',
    payloadSha256: '03e669d6cff84ca278c2a8c846613d3f9e307a957b4ccfe0b1a29d1404d3a982',
    factionIds: PILOT_FACTIONS,
    replaces: ['147c89ec683b2b82b7fb6a5196b9d11c476cf323612a3ab4f5145a848069ec6a'],
  },
  {
    "catalogId": "lm_43ea9fb28513244b916544dc",
    "catalogVersion": "pilot-1",
    "payloadSha256": "65c91a608f59f47b1f629d88a635c5e66848b4591ab353e672b6483a908aa50d",
    "factionIds": [
      "f_910e2f5f2a24c62ebb4b3308"
    ]
  },
  {
    "catalogId": "lm_13f241d144f7399ffb2fd9f3",
    "catalogVersion": "pilot-1",
    "payloadSha256": "46f7228c5c99a632b52ef36bf051fb8d7a3df086ce238946fe25c60fbe48c458",
    "factionIds": [
      "f_67225e1d3a000864ab07f63a"
    ]
  },
  {
    "catalogId": "lm_544087989f1020e6f671870a",
    "catalogVersion": "pilot-1",
    "payloadSha256": "147c89ec683b2b82b7fb6a5196b9d11c476cf323612a3ab4f5145a848069ec6a",
    "factionIds": [
      "f_67225e1d3a000864ab07f63a",
      "f_910e2f5f2a24c62ebb4b3308"
    ]
  }
];
