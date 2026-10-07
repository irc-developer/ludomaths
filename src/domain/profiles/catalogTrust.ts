/** Own catalog revisions and digests, independent of any external version. */
export interface TrustedCatalog { catalogId: string; catalogVersion: string; payloadSha256: string; factionIds: readonly string[] }
export const PILOT_FACTIONS = ["f_67225e1d3a000864ab07f63a","f_910e2f5f2a24c62ebb4b3308"] as const;
export const TRUSTED_CATALOGS: readonly TrustedCatalog[] = [
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
