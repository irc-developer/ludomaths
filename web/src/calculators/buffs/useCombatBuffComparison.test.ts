import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CombatParams } from '../combat/presets';
import { useCombatBuffComparison } from './useCombatBuffComparison';
import { useCombat } from '../combat/useCombat';

const BASE: CombatParams = {
  attacks: 4,
  hitThreshold: 4,
  strength: 6,
  ap: 1,
  damage: 1,
  toughness: 3,
  targetWounds: 1,
  baseSave: 6,
};

describe('useCombatBuffComparison', () => {
  it('uses the same effective rerolls as combat for baseline and buffed scenarios', () => {
    const params = { ...BASE, hitRerollAll: true, hitRerollNonSixes: true, woundRerollNonSixes: true };
    const { result } = renderHook(() => useCombatBuffComparison(params));
    const { result: combat } = renderHook(() => useCombat(params));
    // BH4+ -> 21/36; wound2+ -> 31/36; save is impossible.
    expect(result.current.baseline.expectedDamage).toBeCloseTo(4 * (21 / 36) * (31 / 36), 12);
    expect(result.current.baseline.expectedDamage).toBeCloseTo(combat.current.expectedDamage, 12);
    expect(result.current.plusBallisticSkill.expectedDamage).toBeCloseTo(4 * (26 / 36) * (31 / 36), 12);
  });

  it('recomienda +1 BS cuando fuerza, FP y daño ya están casi saturados', () => {
    const { result } = renderHook(() => useCombatBuffComparison({
      ...BASE,
      strength: 10,
      ap: 4,
      damage: 6,
    }));

    expect(result.current.error).toBeUndefined();
    expect(result.current.recommendedOption).toBe('equal');
    expect(result.current.plusHitRoll?.expectedDamage).toBeCloseTo(result.current.plusBallisticSkill.expectedDamage, 12);
    expect(result.current.plusBallisticSkill.expectedDamage).toBeGreaterThan(
      result.current.plusDamage.expectedDamage,
    );
  });

  it('aplica +1 Salvacion como mejora defensiva del objetivo', () => {
    const { result } = renderHook(() => useCombatBuffComparison({
      ...BASE,
      attacks: 4,
      hitThreshold: 2,
      strength: 10,
      ap: 0,
      damage: 2,
      toughness: 5,
      baseSave: 4,
    }));

    expect(result.current.error).toBeUndefined();
    expect(result.current.plusSave.expectedDamage).toBeLessThan(
      result.current.baseline.expectedDamage,
    );
    expect(result.current.plusSave.expectedRoundsToKill).toBeGreaterThan(
      result.current.baseline.expectedRoundsToKill,
    );
  });

  it('recomienda +1 FP cuando mejorar la tirada de salvación rival es lo mejor', () => {
    const { result } = renderHook(() => useCombatBuffComparison({
      ...BASE,
      attacks: 1,
      hitThreshold: 2,
      strength: 10,
      ap: 0,
      damage: 6,
      toughness: 3,
      baseSave: 2,
    }));

    expect(result.current.error).toBeUndefined();
    expect(result.current.recommendedOption).toBe('armorPenetration');
    expect(result.current.plusArmorPenetration.expectedDamage).toBeGreaterThan(
      result.current.plusDamage.expectedDamage,
    );
  });

  it('recomienda +1 daño cuando impactar, herir y atravesar la armadura ya están resueltos', () => {
    const { result } = renderHook(() => useCombatBuffComparison({
      ...BASE,
      attacks: 3,
      hitThreshold: 2,
      strength: 10,
      ap: 4,
      damage: 1,
      toughness: 3,
      targetWounds: 4,
      baseSave: 6,
    }));

    expect(result.current.error).toBeUndefined();
    expect(result.current.recommendedOption).toBe('damage');
    expect(result.current.plusDamage.expectedDamage).toBeGreaterThan(
      result.current.plusBallisticSkill.expectedDamage,
    );
  });

  it('propaga un error si los parámetros violan las precondiciones del dominio', () => {
    const { result } = renderHook(() => useCombatBuffComparison({
      ...BASE,
      targetWounds: 0,
    }));

    expect(result.current.error).toBeDefined();
  });
});
