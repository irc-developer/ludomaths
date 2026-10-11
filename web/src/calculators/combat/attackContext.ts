import type { ProfileCatalog } from '@domain/profiles/catalog';
import type { CombatParams } from './presets';
import { s, type ScenarioKey } from '../../i18n/scenario';

type ContextKey = 'withinHalfRange' | 'phase' | 'engaged' | 'setUpThisTurn' | 'movedOverThree';
export const attackContextId = (group = 'primary', weapon = 0) => `wizard-context-${encodeURIComponent(group)}-${weapon}`;
const definitions: Array<{ key: ContextKey; label: ScenarioKey; prompt: ScenarioKey }> = [
  { key: 'withinHalfRange', label: 'halfRange', prompt: 'contextHalfRangePrompt' },
  { key: 'phase', label: 'phase', prompt: 'contextPhasePrompt' },
  { key: 'engaged', label: 'engaged', prompt: 'contextEngagedPrompt' },
  { key: 'setUpThisTurn', label: 'arrived', prompt: 'contextArrivalPrompt' },
  { key: 'movedOverThree', label: 'moved', prompt: 'contextMovementPrompt' },
];

/** Display requirements from the effective executable flags, never from rule descriptions. */
export function describeAttackContext(profiles: CombatParams[], catalog: ProfileCatalog | null, prefix: string) {
  return definitions.flatMap(definition => {
    const relevant = profiles.filter(p => p.attackType !== 'melee' && (definition.key === 'withinHalfRange'
      ? (p.rapidFire ?? 0) > 0 || (p.melta ?? 0) > 0 : p.heavy));
    if (!relevant.length) return [];
    const sources = [...new Set(relevant.map(p => {
      const mode = catalog?.weaponModes.find(m => m.id === p.catalogSelection?.modeId);
      const weapon = catalog?.weapons.find(w => w.id === mode?.weaponId);
      const name = weapon ? `${weapon.name}${mode?.name ? ` · ${mode.name}` : ''}` : s('wizardWeapon');
      const rules = definition.key === 'withinHalfRange' ? [(p.rapidFire ?? 0) > 0 && 'Rapid Fire', (p.melta ?? 0) > 0 && 'Melta'].filter(Boolean).join(' / ') : 'Heavy';
      return `${name} (${rules})`;
    }))];
    return [{ ...definition, target: `${prefix}-${definition.key}`,
      missing: relevant.some(p => p[definition.key] === undefined),
      message: `${sources.join(', ')}: ${s(definition.prompt)}`, help: `${s('contextNeededFor')} ${sources.join(', ')}.` }];
  });
}

export function missingAttackContext(params: CombatParams, catalog: ProfileCatalog | null) {
  const all = [params, ...(params.primaryExtraWeapons ?? []), ...(params.attackerEquipmentGroups ?? []).flatMap(g => g.weapons)];
  if (params.squadEquipment) return describeAttackContext(all, catalog, attackContextId()).filter(field => field.missing);
  return [
    ...describeAttackContext([params], catalog, attackContextId()),
    ...(params.primaryExtraWeapons ?? []).flatMap((p, i) => describeAttackContext([p], catalog, attackContextId('primary', i + 1))
      .map(field => ({ ...field, message: `${s('attackerGroup')} 1 · ${s('weapon')} ${i + 2}: ${field.message}` }))),
    ...(params.attackerEquipmentGroups ?? []).flatMap((g, groupIndex) => g.weapons.flatMap((p, i) => describeAttackContext([p], catalog, attackContextId(g.id, i))
      .map(field => ({ ...field, message: `${s('attackerGroup')} ${groupIndex + 2} · ${s('weapon')} ${i + 1}: ${field.message}` })))),
  ].filter(field => field.missing);
}
