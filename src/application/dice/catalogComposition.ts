import type { ProfileCatalog } from '@domain/profiles/catalog';
import type { CombatScenarioInput } from './combatScenario';
import { resolveCatalogScenario, type CatalogSelection } from './catalogScenario';
import { individualProfile, replacePrimaryProfile } from './squadScenario';

/** Suggest the minimum listed composition; current battle quantities remain user input. */
export function applyCatalogComposition(catalog: ProfileCatalog, base: CombatScenarioInput, side: 'attacker' | 'defender', compositionId: string): CombatScenarioInput {
  const composition = catalog.compositions.find(c => c.id === compositionId);
  const selection = base.catalogSelection;
  const unitId = side === 'attacker' ? selection?.attackerUnitId : selection?.defenderUnitId;
  if (!selection || !composition || composition.unitId !== unitId || composition.conditionRuleIds.length) throw new RangeError('CATALOG_COMPOSITION_UNSUPPORTED');
  const members = composition.members.filter(m => m.min > 0);
  const total = members.reduce((sum, m) => sum + m.min, 0);
  if (!members.length || total > 100) throw new RangeError('CATALOG_COMPOSITION_UNSUPPORTED');
  const current = side === 'attacker' ? selection.attackerMiniatureId : selection.defenderMiniatureId;
  const primary = members.find(m => m.miniatureId === current) ?? [...members].sort((a, b) => b.min - a.min)[0];
  const others = members.filter(m => m !== primary);
  const select = (miniatureId: string): CatalogSelection => {
    if (side === 'defender') return { ...selection, defenderMiniatureId: miniatureId, defenderCompositionId: compositionId };
    const weapons = catalog.equipmentChoices.filter(c => c.miniatureId === miniatureId).flatMap(c => c.weaponIds);
    const modes = catalog.weaponModes.filter(m => weapons.includes(m.weaponId) && m.type === (base.attackType ?? 'ranged'));
    const selectedMode = miniatureId === selection.attackerMiniatureId && modes.some(m => m.id === selection.modeId)
      ? selection.modeId : modes.length === 1 ? modes[0].id : undefined;
    return { ...selection, attackerMiniatureId: miniatureId, attackerCompositionId: compositionId, modeId: selectedMode };
  };
  const profile = (miniatureId: string) => {
    const next = select(miniatureId);
    const miniature = catalog.miniatures.find(m => m.id === miniatureId);
    const wounds = miniature?.characteristics.woundsMax.normalized;
    const remaining = typeof wounds === 'number' ? wounds : wounds && typeof wounds === 'object' && wounds.kind === 'fixed' ? wounds.value : undefined;
    if (side === 'defender' && !remaining) throw new RangeError('CATALOG_CHARACTERISTIC_UNAVAILABLE');
    const individual = { ...individualProfile(base), ...(side === 'defender' ? { targetWounds: remaining! } : {}) };
    // Composition selection must work before the opposite side or weapon context is ready.
    let reviewed;
    try { reviewed = resolveCatalogScenario(catalog, side === 'defender' ? { ...next, modeId: undefined } : next, individual); }
    catch (error) {
      if (side !== 'attacker' || !(error instanceof Error) ||
        !['CATALOG_TARGET_CONTEXT_REQUIRED', 'CATALOG_TARGET_NOT_ELIGIBLE'].includes(error.message)) throw error;
      reviewed = resolveCatalogScenario(catalog, { ...next, modeId: undefined }, individual);
    }
    return { ...reviewed.params, catalogSelection: next, calculationBlocked: false };
  };
  const main = profile(primary.miniatureId);
  return { ...replacePrimaryProfile(base, main, side), catalogSelection: main.catalogSelection,
    ...(side === 'attacker' ? { modelCount: total, primaryExtraWeapons: [],
      attackerEquipmentGroups: others.map((m, i) => ({ id: `composition-a-${i}`, count: m.min, weapons: [profile(m.miniatureId)] })) }
      : { modelCount: base.modelCount, targetModelCount: total, primaryIsCharacter: false,
        casualtyGoal: total, defenderGroups: others.map((m, i) => ({ id: `composition-d-${i}`, count: m.min, profile: profile(m.miniatureId) })) }),
    acceptedSquadOmissions: [],
  };
}
