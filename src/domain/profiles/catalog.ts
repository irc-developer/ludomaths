import { catalogSchema } from './catalogSchema';
import { TRUSTED_CATALOGS, type TrustedCatalog } from './catalogTrust';
import { characteristicDistribution, parseSignedAp } from '../dice/characteristic';

export type NormalizedValue = number | { kind: 'fixed'; value: number } |
  { kind: 'dice'; count: number; sides: 3 | 6; modifier: number } |
  { kind: 'inches'; value: number } | { kind: 'melee' } | null;
export interface CatalogValue { raw: string | number | null; normalized: NormalizedValue;
  status: 'parsed' | 'missing' | 'not-applicable' | 'ambiguous' | 'unsupported' }
export interface CatalogRule { id: string; name: string; description: string;
  reviewState: 'reviewed' | 'pending' | 'out-of-scope'; reviewVersion: string | null;
  capabilityId: string | null; parameters: Readonly<Record<string, number | readonly string[]>>; requiredContext: string[] }
export interface CatalogUnit { id: string; name: string; factionIds: string[]; miniatureIds: string[];
  compositionIds: string[]; equipmentChoiceIds: string[]; ruleIds: string[] }
export interface CatalogMiniature { id: string; unitId: string; name: string; keywordIds: string[]; ruleIds: string[];
  characteristics: { toughness: CatalogValue; save: CatalogValue; woundsMax: CatalogValue };
  invulnerableSaves: Array<{ id: string; scope: 'unit' | 'miniature'; miniatureId: string | null;
    save: CatalogValue; rangedSave: CatalogValue; meleeSave: CatalogValue; conditionRuleIds: string[] }> }
export interface CatalogMode { id: string; weaponId: string; name: string; type: 'ranged' | 'melee'; range: CatalogValue;
  characteristics: { attacks: CatalogValue; ballisticSkill: CatalogValue; weaponSkill: CatalogValue;
    strength: CatalogValue; armourPenetration: CatalogValue; damage: CatalogValue };
  targetCondition: { state: 'not-applicable' | 'reviewed' | 'pending'; match: 'any' | 'none' | null; keywordIds: string[]; ruleIds: string[] };
  ruleIds: string[] }
export interface ProfileCatalog {
  format: string; schemaVersion: string; edition: string; catalogId: string; catalogVersion: string;
  payloadSha256: string; generatedAt: string; capabilityReviewVersion: string;
  scope: { factionIds: string[]; profile: string; eligibility: string; coverage: string; selectedUnitIds: string[] };
  factions: Array<{ id: string; name: string; parentId: string | null }>;
  units: CatalogUnit[]; miniatures: CatalogMiniature[];
  weapons: Array<{ id: string; name: string; modeIds: string[]; ruleIds: string[] }>;
  weaponModes: CatalogMode[]; keywords: Array<{ id: string; name: string }>;
  compositions: Array<{ id: string; unitId: string; isDefault: boolean; members: Array<{ miniatureId: string; min: number; max: number }>; conditionRuleIds: string[] }>;
  equipmentChoices: Array<{ id: string; unitId: string; miniatureId: string; kind: string; weaponIds: string[]; min: number; max: number; allowDuplicates: boolean | null; conditionRuleIds: string[] }>;
  rules: CatalogRule[];
  relations: Array<{ id: string; kind: string; fromId: string; toId: string; quantity: number | null; conditionRuleIds: string[] }>;
  issues: Array<{ code: string; severity: string; entityId: string; field: string; affects: string; messageCode: string }>;
  coverage: Array<{ entityId: string; component: string; state: string; issueCodes: string[] }>;
}

interface Schema { $ref?: string; type?: string; enum?: readonly unknown[]; anyOf?: readonly Schema[]; oneOf?: readonly Schema[];
  properties?: Readonly<Record<string, Schema>>; required?: readonly string[]; additionalProperties?: boolean;
  items?: Schema; maxItems?: number; minLength?: number; maxLength?: number; pattern?: string;
  minimum?: number; maximum?: number; format?: string; $defs?: Readonly<Record<string, Schema>> }
const schema = catalogSchema as unknown as Schema;
const invalid = (): never => { throw new RangeError('CATALOG_INVALID'); };
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Interpret only the bundled closed contract. Never interpret downloaded schemas or code. */
function matches(value: unknown, spec: Schema): boolean {
  if (spec.$ref) return matches(value, schema.$defs![spec.$ref.slice('#/$defs/'.length)]);
  if (spec.enum && !spec.enum.some(item => item === value)) return false;
  if (spec.anyOf && !spec.anyOf.some(item => matches(value, item))) return false;
  if (spec.oneOf && spec.oneOf.filter(item => matches(value, item)).length !== 1) return false;
  if (spec.type === 'null') return value === null;
  if (spec.type === 'boolean') return typeof value === 'boolean';
  if (spec.type === 'integer') return typeof value === 'number' && Number.isSafeInteger(value) &&
    value >= (spec.minimum ?? -Infinity) && value <= (spec.maximum ?? Infinity);
  if (spec.type === 'string') return typeof value === 'string' && value.length >= (spec.minLength ?? 0) &&
    value.length <= (spec.maxLength ?? Infinity) && (!spec.pattern || new RegExp(spec.pattern).test(value)) &&
    (spec.format !== 'date-time' || /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)));
  if (spec.type === 'array') return Array.isArray(value) && value.length <= (spec.maxItems ?? Infinity) && value.every(item => matches(item, spec.items!));
  if (spec.type === 'object') {
    if (!object(value) || spec.required?.some(key => !Object.prototype.hasOwnProperty.call(value, key))) return false;
    return Object.keys(value).every(key => spec.properties?.[key] ? matches(value[key], spec.properties[key]) : spec.additionalProperties !== false);
  }
  return true;
}

export function canonicalCatalog(value: unknown): string {
  function ordered(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(ordered);
    if (object(item)) return Object.fromEntries(Object.keys(item).sort().map(key => [key, ordered(item[key])]));
    return item;
  }
  if (!object(value)) return invalid();
  const clean = Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'payloadSha256'));
  return JSON.stringify(ordered(clean));
}

/** Recompute normalized characteristics from the entire raw token. */
function validateValue(value: CatalogValue, field: string): void {
  if (value.status !== 'parsed') { if (value.normalized !== null) invalid(); return; }
  const raw = String(value.raw ?? '');
  let normalized: NormalizedValue;
  if (['save', 'rangedSave', 'meleeSave', 'ballisticSkill', 'weaponSkill'].includes(field)) {
    if (!/^[2-6]\+$/.test(raw)) invalid();
    normalized = Number(raw[0]);
  } else if (field === 'armourPenetration') normalized = parseSignedAp(raw);
  else if (field === 'range') {
    if (raw === 'Melee') normalized = { kind: 'melee' };
    else if (/^\d{1,3}"$/.test(raw)) normalized = { kind: 'inches', value: Number(raw.slice(0, -1)) };
    else return invalid();
  } else if (['attacks', 'strength', 'damage'].includes(field)) {
    const distribution = characteristicDistribution(raw);
    if (distribution.some(entry => entry.value < 1 || entry.value > 100)) invalid();
    const match = /^(\d+)?D([36])(?:\+(\d+))?$/.exec(raw.toUpperCase());
    normalized = match ? { kind: 'dice', count: Number(match[1] ?? 1), sides: Number(match[2]) as 3 | 6, modifier: Number(match[3] ?? 0) } :
      { kind: 'fixed', value: Number(raw) };
  } else {
    if (!/^\d{1,3}$/.test(raw) || Number(raw) < 1 || Number(raw) > (field === 'woundsMax' ? 500 : 100)) invalid();
    normalized = Number(raw);
  }
  if (JSON.stringify(Object.entries(normalized !== null && typeof normalized === 'object' ? normalized : { value: normalized }).sort()) !==
    JSON.stringify(Object.entries(value.normalized !== null && typeof value.normalized === 'object' ? value.normalized : { value: value.normalized }).sort())) invalid();
}

export function validateCatalog(input: unknown, registry: readonly TrustedCatalog[] = TRUSTED_CATALOGS): ProfileCatalog {
  try {
    let nodes = 0;
    function resources(value: unknown, depth = 0): void {
      if (++nodes > 50000 || depth > 20) invalid();
      if (Array.isArray(value)) value.forEach(item => resources(item, depth + 1));
      else if (object(value)) Object.values(value).forEach(item => resources(item, depth + 1));
    }
    resources(input);
    if (!matches(input, schema)) invalid();
    // Reconstruct only after every nested property passed the positive schema.
    const catalog = JSON.parse(JSON.stringify(input)) as ProfileCatalog;
    const trusted = registry.find(entry => entry.catalogId === catalog.catalogId && entry.catalogVersion === catalog.catalogVersion &&
      entry.payloadSha256 === catalog.payloadSha256);
    if (!trusted || catalog.scope.coverage === 'full-faction' || !catalog.scope.selectedUnitIds.length ||
      !catalog.scope.factionIds.length || catalog.factions.some(f => !trusted.factionIds.includes(f.id)) ||
      catalog.scope.factionIds.some(id => !trusted.factionIds.includes(id))) invalid();
    const entities = [...catalog.factions, ...catalog.units, ...catalog.miniatures, ...catalog.weapons,
      ...catalog.weaponModes, ...catalog.keywords, ...catalog.compositions, ...catalog.equipmentChoices,
      ...catalog.rules, ...catalog.relations, ...catalog.miniatures.flatMap(m => m.invulnerableSaves)];
    const ids = new Set(entities.map(entity => entity.id));
    if (ids.size !== entities.length) invalid();
    const references = new Set(['factionIds', 'miniatureIds', 'compositionIds', 'equipmentChoiceIds', 'weaponIds',
      'modeIds', 'ruleIds', 'keywordIds', 'conditionRuleIds', 'selectedUnitIds']);
    const reference = (value: unknown) => { if (value !== null && (typeof value !== 'string' || !ids.has(value))) invalid(); };
    function traverse(value: unknown, field = ''): void {
      if (object(value)) {
        if (Object.prototype.hasOwnProperty.call(value, 'raw') && Object.prototype.hasOwnProperty.call(value, 'normalized')) validateValue(value as unknown as CatalogValue, field);
        else for (const [key, item] of Object.entries(value)) {
          if (references.has(key)) (item as unknown[]).forEach(reference);
          else if (['unitId', 'weaponId', 'miniatureId', 'parentId', 'fromId', 'toId', 'entityId'].includes(key)) reference(item);
          traverse(item, key);
        }
      } else if (Array.isArray(value)) value.forEach(item => traverse(item, field));
    }
    traverse(catalog);
    const unitById = new Map(catalog.units.map(u => [u.id, u]));
    const miniatureById = new Map(catalog.miniatures.map(m => [m.id, m]));
    for (const unit of catalog.units) {
      if (!catalog.scope.selectedUnitIds.includes(unit.id) || !unit.factionIds.length || unit.factionIds.some(id => !catalog.scope.factionIds.includes(id)) ||
        unit.miniatureIds.some(id => miniatureById.get(id)?.unitId !== unit.id) ||
        unit.compositionIds.some(id => catalog.compositions.find(c => c.id === id)?.unitId !== unit.id) ||
        unit.equipmentChoiceIds.some(id => catalog.equipmentChoices.find(c => c.id === id)?.unitId !== unit.id)) invalid();
    }
    for (const miniature of catalog.miniatures) {
      if (!unitById.get(miniature.unitId)?.miniatureIds.includes(miniature.id)) invalid();
      for (const save of miniature.invulnerableSaves) if (save.scope === 'miniature' ? save.miniatureId !== miniature.id : save.miniatureId !== null) invalid();
    }
    for (const mode of catalog.weaponModes) {
      if (!catalog.weapons.find(w => w.id === mode.weaponId)?.modeIds.includes(mode.id)) invalid();
      const unused = mode.type === 'ranged' ? mode.characteristics.weaponSkill : mode.characteristics.ballisticSkill;
      if (unused.status !== 'not-applicable') invalid();
      if (mode.type === 'melee' ? mode.range.normalized === null || typeof mode.range.normalized !== 'object' || mode.range.normalized.kind !== 'melee' :
        mode.range.normalized === null || typeof mode.range.normalized !== 'object' || mode.range.normalized.kind !== 'inches') invalid();
    }
    for (const weapon of catalog.weapons) if (weapon.modeIds.some(id => catalog.weaponModes.find(m => m.id === id)?.weaponId !== weapon.id)) invalid();
    for (const composition of catalog.compositions) if (!unitById.get(composition.unitId)?.compositionIds.includes(composition.id) ||
      composition.members.some(m => m.min > m.max || miniatureById.get(m.miniatureId)?.unitId !== composition.unitId)) invalid();
    for (const choice of catalog.equipmentChoices) if (choice.min > choice.max || !unitById.get(choice.unitId)?.equipmentChoiceIds.includes(choice.id) ||
      miniatureById.get(choice.miniatureId)?.unitId !== choice.unitId) invalid();
    for (const relation of catalog.relations) {
      if (relation.kind === 'unit-miniature' && miniatureById.get(relation.toId)?.unitId !== relation.fromId ||
        relation.kind === 'weapon-mode' && catalog.weaponModes.find(m => m.id === relation.toId)?.weaponId !== relation.fromId ||
        relation.kind === 'choice-weapon' && !catalog.equipmentChoices.find(c => c.id === relation.fromId)?.weaponIds.includes(relation.toId)) invalid();
    }
    return catalog;
  } catch { return invalid(); }
}
