import type { ProfileCatalog, CatalogRule, CatalogValue } from '@domain/profiles/catalog';
import type { CombatScenarioInput } from './combatScenario';

export interface CatalogSelection { catalogId: string; catalogVersion: string; payloadSha256: string;
  attackerUnitId?: string; attackerMiniatureId?: string; modeId?: string; defenderUnitId?: string; defenderMiniatureId?: string;
  attackerCompositionId?: string; defenderCompositionId?: string }
export interface CatalogScenarioReview { params: CombatScenarioInput; pending: CatalogRule[]; excluded: CatalogRule[] }

function scalar(value: CatalogValue): number {
  if (value.status !== 'parsed') throw new RangeError('CATALOG_CHARACTERISTIC_UNAVAILABLE');
  if (typeof value.normalized === 'number') return value.normalized;
  if (value.normalized?.kind === 'fixed') return value.normalized.value;
  throw new RangeError('CATALOG_CHARACTERISTIC_UNSUPPORTED');
}
function expression(value: CatalogValue): string {
  if (value.status !== 'parsed' || value.normalized === null || typeof value.normalized !== 'object' ||
    !['fixed', 'dice'].includes(value.normalized.kind)) throw new RangeError('CATALOG_CHARACTERISTIC_UNAVAILABLE');
  return String(value.raw);
}

/** Bind own reviewed capabilities only. Labels never determine executable behavior. */
export function resolveCatalogScenario(catalog: ProfileCatalog, selection: CatalogSelection, base: CombatScenarioInput): CatalogScenarioReview {
  if (catalog.catalogId !== selection.catalogId || catalog.catalogVersion !== selection.catalogVersion || catalog.payloadSha256 !== selection.payloadSha256) {
    throw new RangeError('CATALOG_SELECTION_EXPIRED');
  }
  let params = { ...base };
  const pending: CatalogRule[] = [];
  const excluded: CatalogRule[] = [];
  const ruleById = new Map(catalog.rules.map(r => [r.id, r]));
  function rules(ids: string[], side: 'attacker' | 'defender'): CatalogRule[] {
    return Array.from(new Set(ids)).map(id => ruleById.get(id)!).filter(rule => {
      if (!rule) throw new RangeError('CATALOG_SELECTION_INVALID');
      if (rule.reviewState === 'out-of-scope') { excluded.push(rule); return false; }
      if (side === 'defender' && rule.capabilityId === 'hitBonus' || side === 'attacker' && rule.capabilityId === 'riledUp') return false;
      return true;
    });
  }
  const effectiveAttackType = catalog.weaponModes.find(m => m.id === selection.modeId)?.type ?? base.attackType;
  const targetMiniature = catalog.miniatures.find(m => m.id === selection.defenderMiniatureId);
  if (selection.defenderMiniatureId) {
    if (!targetMiniature || targetMiniature.unitId !== selection.defenderUnitId) throw new RangeError('CATALOG_SELECTION_INVALID');
    const unit = catalog.units.find(u => u.id === targetMiniature.unitId)!;
    const saves = targetMiniature.invulnerableSaves.filter(save => save.conditionRuleIds.length === 0)
      .map(save => effectiveAttackType === 'melee' && save.meleeSave.status === 'parsed' ? scalar(save.meleeSave) :
        effectiveAttackType !== 'melee' && save.rangedSave.status === 'parsed' ? scalar(save.rangedSave) :
        save.save.status === 'parsed' ? scalar(save.save) : undefined).filter((value): value is number => value !== undefined);
    const woundsMax = scalar(targetMiniature.characteristics.woundsMax);
    params = { ...params, toughness: scalar(targetMiniature.characteristics.toughness), baseSave: scalar(targetMiniature.characteristics.save),
      woundsMax, targetWounds: base.targetWounds, invulnerableSave: saves.length ? Math.min(...saves) : undefined,
      fnpThreshold: undefined, guaranteedSaveSix: undefined };
    pending.push(...rules([...unit.ruleIds, ...targetMiniature.ruleIds, ...targetMiniature.invulnerableSaves.flatMap(save => save.conditionRuleIds)], 'defender'));
  }
  if (selection.modeId) {
    const mode = catalog.weaponModes.find(m => m.id === selection.modeId);
    const miniature = catalog.miniatures.find(m => m.id === selection.attackerMiniatureId);
    const unit = catalog.units.find(u => u.id === selection.attackerUnitId);
    if (!mode || !miniature || !unit || miniature.unitId !== unit.id ||
      !catalog.equipmentChoices.some(choice => choice.unitId === unit.id && choice.miniatureId === miniature.id && choice.weaponIds.includes(mode.weaponId))) {
      throw new RangeError('CATALOG_SELECTION_INVALID');
    }
    const weapon = catalog.weapons.find(w => w.id === mode.weaponId)!;
    const applicable = rules([...unit.ruleIds, ...miniature.ruleIds, ...weapon.ruleIds, ...mode.ruleIds, ...mode.targetCondition.ruleIds], 'attacker');
    const supported = new Set(['torrent', 'heavy', 'rapidFire', 'devastatingWounds']);
    const abilities = applicable.filter(rule => rule.reviewState === 'reviewed' && rule.reviewVersion === '1.0.0' && supported.has(rule.capabilityId ?? ''));
    pending.push(...applicable.filter(rule => !abilities.includes(rule)));
    const has = (capability: string) => abilities.some(r => r.capabilityId === capability);
    const torrent = has('torrent');
    const skill = mode.type === 'ranged' ? mode.characteristics.ballisticSkill : mode.characteristics.weaponSkill;
    params = { ...params, attackType: mode.type, attacksExpression: expression(mode.characteristics.attacks),
      damageExpression: expression(mode.characteristics.damage), damageBonus: base.damageBonus ?? 0, strength: scalar(mode.characteristics.strength),
      ap: scalar(mode.characteristics.armourPenetration),
      hitThreshold: torrent && skill.raw === '-' && skill.status === 'unsupported' ? 2 : scalar(skill),
      attacksD6: false, damageD6: false, torrent, heavy: has('heavy'),
      rapidFire: abilities.find(r => r.capabilityId === 'rapidFire')?.parameters.additionalAttacks as number | undefined,
      devastatingWounds: has('devastatingWounds'), lethalHits: false, sustainedHits: undefined, melta: undefined,
      ignoresCover: false, twinLinked: false, mortalWoundsPerHit: undefined,
      guaranteedHitSix: undefined, guaranteedWoundSix: undefined, guaranteedDamageSix: undefined };
    const condition = mode.targetCondition;
    if (condition.state === 'reviewed' && condition.keywordIds.length) {
      if (!targetMiniature) throw new RangeError('CATALOG_TARGET_CONTEXT_REQUIRED');
      const match = condition.keywordIds.some(id => targetMiniature.keywordIds.includes(id));
      if (condition.match === 'any' ? !match : match) throw new RangeError('CATALOG_TARGET_NOT_ELIGIBLE');
    } else if (condition.state === 'pending' && condition.ruleIds.length === 0) throw new RangeError('CATALOG_TARGET_CONTEXT_REQUIRED');
  }
  return { params, pending: Array.from(new Map(pending.map(r => [r.id, r])).values()),
    excluded: Array.from(new Map(excluded.map(r => [r.id, r])).values()) };
}
