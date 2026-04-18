/**
 * @module profileFormConversion
 *
 * Pure conversion and validation helpers for the profile form.
 * Separated from the hook to keep useProfileForm focused on React state
 * logic (Single Responsibility Principle).
 *
 * Nothing here imports from React — all functions are plain TS, fully
 * unit-testable without a component tree.
 */

import type { StoredUnitProfile } from '@application/profiles/IProfileRepository';
import type { UnitProfile } from '@domain/profiles/unitProfile';
import type { SavePool } from '@domain/dice/savePool';
import type { WeaponGroup } from '@domain/dice/weapon';
import type { Distribution } from '@domain/math/distribution';

// ── Form shape ────────────────────────────────────────────────────────────────

export interface WeaponFormRow {
  attacks: string;
  hitThreshold: string;
  strength: string;
  ap: string;
  damage: string;
  modelCount: string;
}

export interface ProfileFormFields {
  name: string;
  wounds: string;
  toughness: string;
  baseSave: string;
  /** Empty string = no invulnerable save. */
  invulnSave: string;
  /** Empty string = no Feel No Pain. */
  fnpThreshold: string;
  weapons: WeaponFormRow[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const EMPTY_FIELDS: ProfileFormFields = {
  name: '',
  wounds: '',
  toughness: '',
  baseSave: '',
  invulnSave: '',
  fnpThreshold: '',
  weapons: [],
};

export const DEFAULT_WEAPON: WeaponFormRow = {
  attacks: '1',
  hitThreshold: '3',
  strength: '4',
  ap: '0',
  damage: '1',
  modelCount: '1',
};

// ── Conversion helpers ────────────────────────────────────────────────────────

export function fixedDist(n: number): Distribution {
  return [{ value: n, probability: 1 }];
}

export function profileToFields(p: StoredUnitProfile): ProfileFormFields {
  const pool = p.savePools[0];
  return {
    name: p.name,
    wounds: String(p.wounds),
    toughness: String(p.toughness),
    baseSave: String(pool.baseSave),
    invulnSave: pool.invulnerableSave != null ? String(pool.invulnerableSave) : '',
    fnpThreshold: pool.fnpThreshold != null ? String(pool.fnpThreshold) : '',
    weapons: p.weaponGroups.map(wg => ({
      attacks: String(wg.attacksDist[0]?.value ?? 1),
      hitThreshold: String(wg.hitThreshold),
      strength: String(wg.strengthDist[0]?.value ?? 4),
      ap: String(wg.ap),
      damage: String(wg.damageDist[0]?.value ?? 1),
      modelCount: String(wg.modelCount),
    })),
  };
}

export function fieldsToProfile(fields: ProfileFormFields): UnitProfile {
  const pool: SavePool = {
    baseSave: parseInt(fields.baseSave, 10),
    fraction: 1,
    ...(fields.invulnSave !== '' ? { invulnerableSave: parseInt(fields.invulnSave, 10) } : {}),
    ...(fields.fnpThreshold !== '' ? { fnpThreshold: parseInt(fields.fnpThreshold, 10) } : {}),
  };
  const weaponGroups: WeaponGroup[] = fields.weapons.map(w => ({
    attacksDist: fixedDist(parseInt(w.attacks, 10)),
    hitThreshold: parseInt(w.hitThreshold, 10),
    strengthDist: fixedDist(parseInt(w.strength, 10)),
    ap: parseInt(w.ap, 10),
    damageDist: fixedDist(parseInt(w.damage, 10)),
    modelCount: parseInt(w.modelCount, 10),
  }));
  return {
    name: fields.name.trim(),
    wounds: parseInt(fields.wounds, 10),
    toughness: parseInt(fields.toughness, 10),
    savePools: [pool],
    weaponGroups,
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateStep0(fields: ProfileFormFields): string | null {
  if (!fields.name.trim()) return 'Unit name is required';
  const wounds = parseInt(fields.wounds, 10);
  if (!Number.isInteger(wounds) || wounds < 1) return 'Wounds must be a positive integer';
  const toughness = parseInt(fields.toughness, 10);
  if (!Number.isInteger(toughness) || toughness < 1) return 'Toughness must be a positive integer';
  const baseSave = parseInt(fields.baseSave, 10);
  if (isNaN(baseSave) || baseSave < 2 || baseSave > 6) return 'Armor save must be between 2 and 6';
  return null;
}
