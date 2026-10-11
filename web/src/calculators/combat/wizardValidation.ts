import type { ProfileCatalog } from '@domain/profiles/catalog';
import { buildCombatScenario, type CombatScenarioInput } from '@application/dice/combatScenario';
import { resolveCatalogScenario } from '@application/dice/catalogScenario';
import { buildSquadScenario, isSquadScenario, replacePrimaryProfile } from '@application/dice/squadScenario';
import { resolveCatalogInput } from '../../catalog/CatalogContext';
import { s, scenarioError } from '../../i18n/scenario';
import { missingAttackContext } from './attackContext';

export function validateAttack(catalog: ProfileCatalog | null, input: CombatScenarioInput, mode: string, successPercent: number) {
  let params = input;
  const errors: string[] = [];
  let contextIssues: ReturnType<typeof missingAttackContext> = [];
  try {
    params = resolveCatalogInput(catalog, input, true);
    if (input.catalogSelection && params.attackType !== (input.attackType ?? 'ranged')) throw new Error('CATALOG_ATTACK_TYPE');
    contextIssues = missingAttackContext(params, catalog);
    const mixed = !!params.primaryExtraWeapons?.length || !!params.attackerEquipmentGroups?.length;
    const validation = mode === 'required' && !isSquadScenario(params) ? { ...params, attacks: 1, attacksExpression: '1', attacksD6: false, modelCount: 1 } :
      mode === 'required' && !mixed && params.requiredSquadUnit !== 'activations' ? { ...params, modelCount: 1 } : params;
    if (isSquadScenario(params)) {
      const squad = buildSquadScenario(validation);
      if (squad.weaponGroups.length > 20 || squad.defenders.length > 20) throw new RangeError('SQUAD_INVALID_INPUT');
      if (squad.weaponGroups.some(w => w.guaranteedHitSixes || w.guaranteedWoundSixes || w.guaranteedDamageValue !== undefined || w.mortalWoundsPerHit))
        throw new RangeError('SQUAD_OBSERVED_UNSUPPORTED');
      if (params.guaranteedSaveSix || params.defenderGroups?.some(g => g.profile.guaranteedSaveSix)) throw new RangeError('SQUAD_OBSERVED_UNSUPPORTED');
      if (squad.defenders.reduce((sum, g) => sum + (g.count - 1) * g.woundsMax + (g.firstModelWounds ?? g.woundsMax), 0) > 500)
        throw new RangeError('SQUAD_COMPLEXITY_LIMIT');
      if (squad.weaponGroups.reduce((sum, w) => sum + Math.max(...w.attacksDist.map(e => e.value)) * w.modelCount * (1 + (w.torrent ? 0 : w.sustainedHits ?? 0)), 0) > 300)
        throw new RangeError('SQUAD_COMPLEXITY_LIMIT');
    } else buildCombatScenario(validation);
  } catch (failure) {
    const code = failure instanceof Error ? failure.message : '';
    if (!contextIssues.length || !['Half-range context is required', 'Heavy requires phase, engagement, arrival and movement context'].includes(code)) errors.push(code === 'CATALOG_TARGET_NOT_ELIGIBLE' ? s('modeTargetInvalid') :
      code === 'EQUIPMENT_COUNTS' ? s('equipmentCountError') : code === 'EQUIPMENT_SHARED_LIMIT' ? s('equipmentSharedLimit') :
      code.startsWith('CATALOG_') ? s('selectionInvalid') : scenarioError(failure));
  }
  const mixed = !!params.primaryExtraWeapons?.length || !!params.attackerEquipmentGroups?.length;
  if (mode === 'required' && mixed) params = { ...params, requiredSquadUnit: 'activations' };
  const goal = params.casualtyGoal ?? params.targetModelCount ?? 1;
  const objectiveInvalid = mode === 'required' && (!Number.isFinite(successPercent) || successPercent <= 0 || successPercent > 100 ||
    isSquadScenario(params) && (!Number.isInteger(goal) || goal < 1 || goal > (params.targetModelCount ?? 1) ||
      !['attacks', 'models', 'activations'].includes(params.requiredSquadUnit ?? 'attacks')));
  const issues = [...contextIssues.map(({ message, target }) => ({ message, target })), ...errors.map(message => ({ message, target: undefined }))];
  return { params, errors: issues.map(issue => issue.message), issues, objectiveInvalid };
}

export interface ReviewIssue { message: string; step: 1 | 2 | 3 | 4; target?: string }
/** Same stable priority and equal-save grouping used by squad allocation. */
export function orderReviewDefenders<T extends { profile: CombatScenarioInput; isCharacter?: boolean }>(groups: T[]): T[] {
  const priority = (g: T) => (g.isCharacter ? 2 : 0) + (g.profile.targetWounds < (g.profile.woundsMax ?? g.profile.targetWounds) ? 0 : 1);
  const ordered = groups.map((g, index) => ({ g, index })).sort((a, b) => priority(a.g) - priority(b.g) || a.index - b.index).map(x => x.g);
  const batches: T[][] = [], equalSaves = new Map<string, T[]>();
  for (const g of ordered) {
    const p = g.profile, key = `${p.woundsMax ?? p.targetWounds}:${p.baseSave}:${p.invulnerableSave ?? 0}`;
    const existing = !g.isCharacter && equalSaves.get(key);
    if (existing) existing.push(g);
    else { const batch = [g]; batches.push(batch); if (!g.isCharacter) equalSaves.set(key, batch); }
  }
  return batches.flat();
}
/** Revalidate identities, defenses and every effective weapon against the current catalog. */
export function validateReview(catalog: ProfileCatalog | null, input: CombatScenarioInput, entryMode: string, mode: string,
  successPercent: number, attackerCountDraft?: string, woundedDefenderId?: string) {
  const issues: ReviewIssue[] = [];
  const selection = input.catalogSelection;
  const composition = catalog?.compositions.find(c => c.id === selection?.attackerCompositionId && c.unitId === selection?.attackerUnitId && !c.conditionRuleIds.length);
  const max = composition?.members.reduce((sum, m) => sum + m.min, 0) ?? 100;
  if (entryMode === 'catalog' && (!catalog || !selection || selection.catalogId !== catalog.catalogId ||
    selection.catalogVersion !== catalog.catalogVersion || selection.payloadSha256 !== catalog.payloadSha256 ||
    !catalog.units.some(u => u.id === selection.attackerUnitId) ||
    !catalog.miniatures.some(m => m.id === selection.attackerMiniatureId && m.unitId === selection.attackerUnitId) ||
    selection.attackerCompositionId && !composition)) issues.push({ step: 1, message: s('selectionInvalid') });
  const count = attackerCountDraft === undefined ? input.modelCount ?? 1 : Number(attackerCountDraft);
  if (attackerCountDraft !== undefined && !attackerCountDraft.trim() || !Number.isInteger(count) || count < 1 || count > max)
    issues.push({ step: 1, message: s('wizardCountError') });
  let defense = input;
  try {
    if (entryMode === 'catalog' && !selection?.defenderMiniatureId) throw new Error('CATALOG_SELECTION_INVALID');
    defense = resolveDefenderDraft(catalog, input);
    issues.push(...defenderErrors(defense).map(message => ({ step: 2 as const, message })));
    if (woundedDefenderId) {
      const p = woundedDefenderId === 'primary' ? defense : defense.defenderGroups?.find(g => g.id === woundedDefenderId)?.profile;
      if (!p || p.targetWounds >= (p.woundsMax ?? p.targetWounds)) issues.push({ step: 2, message: s('wizardWoundsError') });
    }
  } catch { issues.push({ step: 2, message: s('wizardMissingDefender') }); }
  const attack = validateAttack(catalog, input, mode, successPercent);
  issues.push(...attack.issues.map(issue => ({ step: 3 as const, ...issue })));
  if (attack.objectiveInvalid) issues.push({ step: 3, target: 'wizard-attack-objective', message: `${s('wizardObjective')}: ${s('invalidInput')}` });
  return { params: attack.params, issues };
}

/** Defensive resolution deliberately defers weapon-dependent conditions until the attack screen. */
export function resolveDefenderDraft(catalog: ProfileCatalog | null, input: CombatScenarioInput): CombatScenarioInput {
  if (!input.catalogSelection) return input;
  if (!catalog) throw new Error('CATALOG_SELECTION_INVALID');
  const selection = input.catalogSelection;
  if (!selection.defenderUnitId || !selection.defenderMiniatureId) throw new Error('CATALOG_SELECTION_INVALID');
  const primary = resolveCatalogScenario(catalog, { ...selection, modeId: undefined }, input).params;
  const defenderGroups = input.defenderGroups?.map(g => {
    if (!g.profile.catalogSelection?.defenderMiniatureId || g.profile.catalogSelection.defenderUnitId !== selection.defenderUnitId) throw new Error('CATALOG_SELECTION_INVALID');
    const next = resolveCatalogScenario(catalog, { ...g.profile.catalogSelection, modeId: undefined }, g.profile).params;
    return { ...g, profile: { ...next, catalogSelection: g.profile.catalogSelection } };
  });
  return { ...replacePrimaryProfile(input, primary, 'defender'), catalogSelection: selection, defenderGroups };
}

export function defenderErrors(params: CombatScenarioInput): string[] {
  const errors: string[] = [];
  const integer = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
  const groups = params.defenderGroups ?? [];
  const total = params.targetModelCount ?? 1;
  const primary = total - groups.reduce((sum, g) => sum + g.count, 0);
  if (!integer(total, 1, 100) || !integer(primary, 1, 100) || groups.some(g => !integer(g.count, 1, 100))) errors.push(s('squadCountError'));
  const all = [{ profile: params, count: primary, isCharacter: params.primaryIsCharacter }, ...groups];
  let wounded = 0;
  for (const g of all) {
    const p = g.profile, max = p.woundsMax ?? p.targetWounds;
    if (!integer(max, 1, total > 1 || groups.length ? 100 : 500) || !integer(p.targetWounds, 1, max)) errors.push(s('wizardWoundsError'));
    if (!integer(p.toughness, 1, 100) || !integer(p.baseSave, 2, 6) || [p.invulnerableSave, p.fnpThreshold].some(n => n !== undefined && !integer(n, 2, 6))) errors.push(s('invalidInput'));
    if (p.targetWounds < max) wounded++;
    if (g.isCharacter && g.count !== 1) errors.push(s('wizardCharacterError'));
  }
  if (wounded > 1) errors.push(s('wizardWoundedError'));
  return [...new Set(errors)];
}
