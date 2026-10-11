import type { ProfileCatalog } from '@domain/profiles/catalog';
import { EQUIPMENT_REVIEWS, type EquipmentReview, type CatalogEquipmentDraft } from '@domain/profiles/catalogEquipment';
import type { CombatScenarioInput } from './combatScenario';
import { resolveCatalogScenario } from './catalogScenario';
import { individualProfile, replacePrimaryProfile } from './squadScenario';

export function equipmentReview(catalog: ProfileCatalog, unitId?: string, registry: readonly EquipmentReview[] = EQUIPMENT_REVIEWS): EquipmentReview | undefined {
  return registry.find(review => review.catalogId === catalog.catalogId && review.catalogVersion === catalog.catalogVersion &&
    review.payloadSha256 === catalog.payloadSha256 && review.unitId === unitId);
}

export function createCatalogEquipment(catalog: ProfileCatalog, base: CombatScenarioInput, registry: readonly EquipmentReview[] = EQUIPMENT_REVIEWS): CatalogEquipmentDraft | undefined {
  const selection = base.catalogSelection;
  const review = equipmentReview(catalog, selection?.attackerUnitId, registry);
  const composition = catalog.compositions.find(c => c.id === selection?.attackerCompositionId);
  if (!review || !selection || selection.catalogId !== catalog.catalogId || selection.catalogVersion !== catalog.catalogVersion ||
    selection.payloadSha256 !== catalog.payloadSha256 || !composition || composition.unitId !== review.unitId || composition.conditionRuleIds.length ||
    composition.members.length !== 2 || !composition.members.some(m => m.miniatureId === review.sergeantId && m.min === 1 && m.max === 1) ||
    !composition.members.some(m => m.miniatureId === review.ordinaryId && m.min === m.max)) return undefined;
  return { reviewId: review.id, initialModelCount: composition.members.reduce((sum, member) => sum + member.min, 0), rows: [] };
}

/** Convert a canonical loadout to the existing disjoint carrier groups. */
export function applyCatalogEquipment(catalog: ProfileCatalog, base: CombatScenarioInput, registry: readonly EquipmentReview[] = EQUIPMENT_REVIEWS): CombatScenarioInput {
  const draft = base.squadEquipment;
  if (!draft) return base;
  const selection = base.catalogSelection;
  const review = equipmentReview(catalog, selection?.attackerUnitId, registry);
  if (!selection || !review || review.id !== draft.reviewId || selection.catalogId !== catalog.catalogId ||
    selection.catalogVersion !== catalog.catalogVersion || selection.payloadSha256 !== catalog.payloadSha256) throw new RangeError('EQUIPMENT_REVIEW_UNAVAILABLE');
  const initial = createCatalogEquipment(catalog, base, registry);
  if (!initial || initial.initialModelCount !== draft.initialModelCount) throw new RangeError('EQUIPMENT_REVIEW_UNAVAILABLE');
  const total = base.modelCount ?? draft.initialModelCount;
  if (!Number.isInteger(total) || total < 1 || total > draft.initialModelCount || draft.rows.length > 12 ||
    new Set(draft.rows.map(row => row.id)).size !== draft.rows.length) throw new RangeError('EQUIPMENT_COUNTS');
  const ordinaryCount = total - 1;
  let selectedCount = 0;
  const groups: Array<{ id: string; count: number; miniatureId: string; weaponIds: string[]; modeIds: Record<string, string> }> = [];
  for (const row of draft.rows) {
    if (!Number.isInteger(row.count) || row.count < 0 || row.count > 100) throw new RangeError('EQUIPMENT_COUNTS');
    const option = review.options.find(o => o.id === row.optionId);
    const choice = catalog.equipmentChoices.find(c => c.id === option?.choiceId);
    if (!option || !choice || choice.unitId !== review.unitId || choice.miniatureId !== review.ordinaryId ||
      option.weaponIds.some(id => !choice.weaponIds.includes(id))) throw new RangeError('EQUIPMENT_OPTION');
    // Validate inactive rows too, including modes from the other attack type.
    for (const [weaponId, modeId] of Object.entries(row.modeIds)) {
      if (!option.weaponIds.includes(weaponId) || !catalog.weaponModes.some(m => m.id === modeId && m.weaponId === weaponId)) throw new RangeError('EQUIPMENT_MODE');
    }
    selectedCount += row.count;
    if (row.count) groups.push({ id: row.id, count: row.count, miniatureId: review.ordinaryId,
      weaponIds: [...review.defaultWeaponIds.filter(id => id !== option.replacesWeaponId), ...option.weaponIds], modeIds: row.modeIds });
  }
  if (selectedCount > Math.floor(draft.initialModelCount / review.modelsPerSpecial)) throw new RangeError('EQUIPMENT_SHARED_LIMIT');
  if (selectedCount > ordinaryCount) throw new RangeError('EQUIPMENT_COUNTS');
  groups.unshift({ id: 'equipment-sergeant', count: 1, miniatureId: review.sergeantId, weaponIds: review.defaultWeaponIds, modeIds: {} });
  if (ordinaryCount > selectedCount) groups.unshift({ id: 'equipment-default', count: ordinaryCount - selectedCount,
    miniatureId: review.ordinaryId, weaponIds: review.defaultWeaponIds, modeIds: {} });
  const attackType = base.attackType ?? 'ranged';
  const resolved = groups.map(group => {
    const weapons = Array.from(new Set(group.weaponIds)).filter(id => catalog.weaponModes.some(m => m.weaponId === id && m.type === attackType)).map(weaponId => {
      const modeId = group.modeIds[weaponId] ?? review.defaultModeIds[weaponId];
      if (!catalog.weaponModes.some(m => m.id === modeId && m.weaponId === weaponId && m.type === attackType)) throw new RangeError('EQUIPMENT_MODE');
      const nextSelection = { ...selection, attackerMiniatureId: group.miniatureId, modeId };
      const result = resolveCatalogScenario(catalog, nextSelection, individualProfile(base));
      return { ...result.params, catalogSelection: nextSelection, calculationBlocked: false };
    });
    if (!weapons.length) throw new RangeError('EQUIPMENT_MODE');
    return { id: group.id, count: group.count, weapons };
  });
  const [primary, ...others] = resolved;
  return { ...replacePrimaryProfile(base, primary.weapons[0], 'attacker'), modelCount: total,
    primaryExtraWeapons: primary.weapons.slice(1), attackerEquipmentGroups: others, calculationBlocked: false };
}

/** Summarize selected modes, preserving their first resolution order. */
export function equipmentSummary(catalog: ProfileCatalog, params: CombatScenarioInput): Array<{ weaponId: string; modeId: string; count: number }> {
  const others = params.attackerEquipmentGroups ?? [];
  const groups = [{ count: (params.modelCount ?? 1) - others.reduce((sum, group) => sum + group.count, 0),
    weapons: [params, ...(params.primaryExtraWeapons ?? [])] }, ...others];
  const summary = new Map<string, { weaponId: string; modeId: string; count: number }>();
  for (const group of groups) for (const weapon of group.weapons) {
    const mode = catalog.weaponModes.find(m => m.id === weapon.catalogSelection?.modeId);
    if (!mode) continue;
    const previous = summary.get(mode.id);
    summary.set(mode.id, { weaponId: mode.weaponId, modeId: mode.id, count: (previous?.count ?? 0) + group.count });
  }
  return [...summary.values()];
}
