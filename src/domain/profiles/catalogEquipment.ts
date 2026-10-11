/** Reviewed product semantics, bound to an exact clean catalog revision. */
export interface EquipmentReview {
  id: string; catalogId: string; catalogVersion: string; payloadSha256: string; unitId: string;
  ordinaryId: string; sergeantId: string; defaultWeaponIds: string[]; defaultModeIds: Record<string, string>;
  options: Array<{ id: string; choiceId: string; replacesWeaponId: string; weaponIds: string[] }>;
  modelsPerSpecial: number;
}
export interface CatalogEquipmentDraft {
  reviewId: string; initialModelCount: number;
  rows: Array<{ id: string; optionId: string; count: number; modeIds: Record<string, string> }>;
}

/** No behavior is inferred from weapon names or downloaded rule descriptions. */
export const EQUIPMENT_REVIEWS: readonly EquipmentReview[] = [{
  id: 'lm-terminator-equipment-1',
  catalogId: 'lm_544087989f1020e6f671870a', catalogVersion: 'expanded-1',
  payloadSha256: '03e669d6cff84ca278c2a8c846613d3f9e307a957b4ccfe0b1a29d1404d3a982',
  unitId: 'u_4ed6f4d7b872610bf552c78a', ordinaryId: 'm_2ddcab5506685800de001d73', sergeantId: 'm_b33e9fbb8fd6a2b7c4509872',
  defaultWeaponIds: ['w_b2088caeb84459c76c42b85c', 'w_ab936acdc72af1153eab97ad'],
  defaultModeIds: {
    w_b2088caeb84459c76c42b85c: 'wm_20e7e57cbf67c48004c4a9f9',
    w_ab936acdc72af1153eab97ad: 'wm_9f18ca209f1301774139b6ad',
    w_1a62f25d666e89cb3c7ca42c: 'wm_83b5b8d6560fa4420c36c22f',
    w_2bbcd53302736dc9690ab0e6: 'wm_90689dea9328883789606bd2',
    w_add5d92a8c3b2aa0ef44036e: 'wm_ab742f791a115d302945d90b',
  },
  options: [
    { id: 'cyclone', choiceId: 'eq_838030d2a8444d398255f114', replacesWeaponId: 'w_b2088caeb84459c76c42b85c',
      weaponIds: ['w_b2088caeb84459c76c42b85c', 'w_1a62f25d666e89cb3c7ca42c'] },
    { id: 'flamer', choiceId: 'eq_0b5d0e49be785d299ee0566e', replacesWeaponId: 'w_b2088caeb84459c76c42b85c', weaponIds: ['w_2bbcd53302736dc9690ab0e6'] },
    { id: 'cannon', choiceId: 'eq_652c5c7bbfa8a2d7644e8f53', replacesWeaponId: 'w_b2088caeb84459c76c42b85c', weaponIds: ['w_add5d92a8c3b2aa0ef44036e'] },
  ], modelsPerSpecial: 5,
}];
