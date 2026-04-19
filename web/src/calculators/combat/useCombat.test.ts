/**
 * Tests del adaptador useCombat.
 *
 * Contrato verificado:
 * - `expectedDamage` coincide con el valor esperado calculado manualmente.
 * - `mostLikelyDamage` y `medianDamage` describen un resultado entero de la distribución.
 * - `pAtLeastOne` está en [0, 1].
 * - `pEliminate` se deriva de las heridas del objetivo, no de la media.
 * - Las probabilidades de la distribución suman 1.
 * - Las habilidades especiales (devastatingWounds, sustainedHits) cambian el
 *   resultado respecto al perfil base: si la mecánica añade daño, E[D] debe subir.
 *
 * Perfil de referencia (salvación imposible, para simplificar el cálculo):
 *   attacks=1, hitThreshold=2 (BH 2+, P=5/6)
 *   strength=4 vs toughness=4 → herir en 4+ (P=3/6=1/2)
 *   ap=1, baseSave=6 → effectiveSave = 7 → salvación imposible (P(fallar)=1)
 *   damage=1 (fijo)
 *
 *   E[D] = 1 × (5/6) × (1/2) × 1 = 5/12 ≈ 0.4167
 *   P(D≥1) = 5/12
 *   Distribución: P(0) = 7/12, P(1) = 5/12
 *
 * Para DevastatingWounds con salvación buena (baseSave=2, AP=0):
 *   Sin DW:  E[D] = 1 × (5/6) × (3/6) × (1/6) = 15/216 ≈ 0.069
 *   Con DW:  E[D] = (5/6)×(2/6)×(1/6) + (5/6)×(1/6) = 10/216 + 30/216 = 40/216 ≈ 0.185
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCombat } from './useCombat';
import type { CombatParams } from './presets';

/**
 * Perfil base: salvación imposible (effectiveSave = baseSave + ap = 7 > 6)
 * para aislar el cálculo de hit×wound sin interferencia del save.
 */
const BASE: CombatParams = {
  attacks: 1,
  hitThreshold: 2,  // P(hit) = 5/6
  strength: 4,
  ap: 1,            // effectiveSave = 6 + 1 = 7 → always fails
  damage: 1,
  toughness: 4,     // S = T → wound on 4+ → P(wound) = 3/6
  targetWounds: 1,
  baseSave: 6,
};

/** Perfil con salvación 2+ para amplificar el efecto de Devastating Wounds. */
const GOOD_SAVE: CombatParams = { ...BASE, baseSave: 2 };

describe('useCombat', () => {
  describe('perfil base — salvación imposible', () => {
    it('E[D] = 1 × (5/6) × (3/6) × 1 = 5/12', () => {
      const { result } = renderHook(() => useCombat(BASE));
      expect(result.current.expectedDamage).toBeCloseTo(5 / 12, 5);
    });

    it('pAtLeastOne = 5/12 (daño fijo = 1)', () => {
      const { result } = renderHook(() => useCombat(BASE));
      expect(result.current.pAtLeastOne).toBeCloseTo(5 / 12, 5);
    });

    it('el daño más probable y la mediana son 0 cuando P(0) = 7/12', () => {
      const { result } = renderHook(() => useCombat(BASE));
      expect(result.current.mostLikelyDamage).toBe(0);
      expect(result.current.medianDamage).toBe(0);
    });

    it('pEliminate coincide con P(≥1) cuando el objetivo tiene 1 herida', () => {
      const { result } = renderHook(() => useCombat(BASE));
      expect(result.current.pEliminate).toBeCloseTo(5 / 12, 5);
    });

    it('pEliminate es 0 si el objetivo tiene más heridas que el máximo daño posible', () => {
      const { result } = renderHook(() => useCombat({ ...BASE, targetWounds: 2 }));
      expect(result.current.pEliminate).toBe(0);
    });

    it('centralRange.low ≤ centralRange.high', () => {
      const { result } = renderHook(() => useCombat(BASE));
      expect(result.current.centralRange.low).toBeLessThanOrEqual(result.current.centralRange.high);
    });

    it('centralRange.low y high son enteros (daño discreto)', () => {
      const { result } = renderHook(() => useCombat(BASE));
      expect(Number.isInteger(result.current.centralRange.low)).toBe(true);
      expect(Number.isInteger(result.current.centralRange.high)).toBe(true);
    });

    it('las probabilidades de la distribución suman 1', () => {
      const { result } = renderHook(() => useCombat(BASE));
      const total = result.current.distribution.reduce((s, e) => s + e.probability, 0);
      expect(total).toBeCloseTo(1, 8);
    });

    it('no hay campo `error` con parámetros válidos', () => {
      const { result } = renderHook(() => useCombat(BASE));
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('habilidades especiales', () => {
    it('devastatingWounds aumenta E[D] cuando la salvación es buena (SA 2+)', () => {
      // Sin DW: E[D] = 15/216; con DW: E[D] = 40/216 (crit wound bypasea SA)
      const { result: r1 } = renderHook(() => useCombat(GOOD_SAVE));
      const { result: r2 } = renderHook(() =>
        useCombat({ ...GOOD_SAVE, devastatingWounds: true }),
      );
      expect(r2.current.expectedDamage).toBeGreaterThan(
        r1.current.expectedDamage,
      );
    });

    it('sustainedHits aumenta E[D] respecto al perfil base', () => {
      const { result: r1 } = renderHook(() => useCombat(BASE));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, sustainedHits: 1 }));
      expect(r2.current.expectedDamage).toBeGreaterThan(
        r1.current.expectedDamage,
      );
    });

    it('damageD6=true da un E[D] diferente al daño fijo equivalente (daño=3.5)', () => {
      // D6 tiene E[X]=3.5; el perfil fijo con damage=3 da E[D] distinto.
      const { result: r1 } = renderHook(() => useCombat({ ...BASE, damage: 3 }));
      const { result: r2 } = renderHook(() =>
        useCombat({ ...BASE, damageD6: true }),
      );
      // Con D6 (media 3.5) el daño esperado debe ser mayor que con daño fijo=3.
      expect(r2.current.expectedDamage).toBeGreaterThan(
        r1.current.expectedDamage,
      );
    });

    // ── damageBonus ────────────────────────────────────────────────────────
    // BASE: P(hit)=5/6, P(wound)=3/6, P(fail save)=1, damage=1
    // Con damageBonus=2: cada herida inflige damage+2 = 3
    // E[D] = (5/6)×(3/6)×1×3 = 45/72 = 15/24 = 5/8 = 0.625
    it('damageBonus=2 triplica E[D] respecto al perfil con daño fijo 1', () => {
      const { result: r1 } = renderHook(() => useCombat(BASE));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, damageBonus: 2 }));
      // Con bonus=2, cada herida vale 3 en lugar de 1 → E[D] se multiplica por 3.
      expect(r2.current.expectedDamage).toBeCloseTo(r1.current.expectedDamage * 3, 5);
    });

    it('damageBonus=0 produce el mismo E[D] que sin bonus', () => {
      const { result: r1 } = renderHook(() => useCombat(BASE));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, damageBonus: 0 }));
      expect(r2.current.expectedDamage).toBeCloseTo(r1.current.expectedDamage, 8);
    });
  });

  // ── invulnerableSave ─────────────────────────────────────────────────────
  // Perfil con AP alto para anular la salvación base y dejar la invulnerable activa.
  // BASE + ap=5 → effectiveSave 6+5=11 → salvación imposible sin invul.
  describe('invulnerableSave', () => {
    it('invulnerable 4+ reduce E[D] cuando la armadura es peor que la invulnerable', () => {
      const highAP: CombatParams = { ...BASE, ap: 5 };
      const { result: r1 } = renderHook(() => useCombat(highAP));
      const { result: r2 } = renderHook(() => useCombat({ ...highAP, invulnerableSave: 4 }));
      expect(r2.current.expectedDamage).toBeLessThan(r1.current.expectedDamage);
    });

    it('invulnerable peor que la armadura no cambia E[D]', () => {
      // SA=3, AP=0 → effectiveSave=3; invul=5+ es peor → no debe cambiar nada.
      const goodArmour: CombatParams = { ...BASE, baseSave: 3, ap: 0 };
      const { result: r1 } = renderHook(() => useCombat(goodArmour));
      const { result: r2 } = renderHook(() => useCombat({ ...goodArmour, invulnerableSave: 5 }));
      expect(r2.current.expectedDamage).toBeCloseTo(r1.current.expectedDamage, 5);
    });
  });

  // ── fnpThreshold ─────────────────────────────────────────────────────────
  // BASE tiene salvación imposible → P(daño)=P(hit)×P(wound).
  // FNP 5+ niega cada punto de daño con P=2/6=1/3 → E[D] se multiplica por 2/3.
  describe('fnpThreshold (Feel No Pain)', () => {
    it('FNP 5+ reduce E[D] a 2/3 del baseline (pFailFNP = 2/3)', () => {
      const { result: r1 } = renderHook(() => useCombat(BASE));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, fnpThreshold: 5 }));
      expect(r2.current.expectedDamage).toBeCloseTo(r1.current.expectedDamage * (2 / 3), 5);
    });

    it('fnpThreshold=undefined produce el mismo resultado que sin FNP', () => {
      const { result: r1 } = renderHook(() => useCombat(BASE));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, fnpThreshold: undefined }));
      expect(r2.current.expectedDamage).toBeCloseTo(r1.current.expectedDamage, 8);
    });
  });

  // ── torrent ───────────────────────────────────────────────────────────────
  // Con torrent=true todos los ataques son impactos automáticos (P(hit)=1).
  // BASE: hitThreshold=2 → P(hit)=5/6.
  // Con torrent y los mismos parámetros: E[D] = 1 × 1 × (3/6) × 1 = 0.5
  // Sin torrent:                          E[D] = 1 × (5/6) × (3/6) × 1 = 5/12
  describe('torrent (auto-hit)', () => {
    it('torrent=true da mayor E[D] que sin torrent (pHit pasa de 5/6 a 1)', () => {
      const { result: r1 } = renderHook(() => useCombat(BASE));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, torrent: true }));
      expect(r2.current.expectedDamage).toBeGreaterThan(r1.current.expectedDamage);
    });

    it('torrent=true: E[D] = P(wound) × P(fail save) × damage = (3/6) × 1 × 1 = 0.5', () => {
      // 1 ataque, torrent → pHit=1; wound en 4+ → P=3/6; save imposible → P(fail)=1; H=1
      const { result } = renderHook(() => useCombat({ ...BASE, torrent: true }));
      expect(result.current.expectedDamage).toBeCloseTo(0.5, 5);
    });

    it('torrent=true ignora hitThreshold: mismo resultado con BH=2 que con BH=6', () => {
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, hitThreshold: 2, torrent: true }));
      const { result: r6 } = renderHook(() => useCombat({ ...BASE, hitThreshold: 6, torrent: true }));
      expect(r6.current.expectedDamage).toBeCloseTo(r2.current.expectedDamage, 8);
    });

    it('torrent=false produce el mismo resultado que omitir torrent', () => {
      const { result: r1 } = renderHook(() => useCombat(BASE));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, torrent: false }));
      expect(r2.current.expectedDamage).toBeCloseTo(r1.current.expectedDamage, 8);
    });
  });

  // ── attacksD6 ─────────────────────────────────────────────────────────────
  // Con attacksD6=true, E[ataques]=3.5 (D6 uniforme).
  // Con attacks=3 fijo, E[ataques]=3 → attacksD6 debe dar mayor E[D].
  describe('attacksD6 (ataques variables D6)', () => {
    it('attacksD6=true da mayor E[D] que attacks=3 fijo', () => {
      const { result: r1 } = renderHook(() => useCombat({ ...BASE, attacks: 3 }));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, attacks: 3, attacksD6: true }));
      // D6 tiene E=3.5 vs 3 fijo → r2 debe ser mayor.
      expect(r2.current.expectedDamage).toBeGreaterThan(r1.current.expectedDamage);
    });

    it('attacksD6=true con torrent: E[D] = (E[D6] × P(wound) × P(fail save) × damage = 3.5 × 0.5 × 1 × 1)', () => {
      const { result } = renderHook(() =>
        useCombat({ ...BASE, attacks: 1, attacksD6: true, torrent: true }),
      );
      // E[D6]=3.5, P(wound 4+)=3/6=0.5, save imposible, H=1
      expect(result.current.expectedDamage).toBeCloseTo(3.5 * 0.5, 4);
    });
  });

  // ── guaranteedSaveSix ─────────────────────────────────────────────────────
  // guaranteedSaveSix=true quita 1 herida del pool antes de tirar salvaciones.
  // BASE: save imposible (baseSave=10 → P(fail)=1), 1 ataque, H=1.
  // Con save posible (baseSave=3, ap=0 → pFail=1/3), garantizar 1 salvación
  // reduce E[D]. Si solo hay 1 herida (1 ataque que impacta y hiere),
  // la herida garantizada la anula completamente → E[D] debería caer a 0.
  describe('guaranteedSaveSix (dado de salvación fijo en 6)', () => {
    it('guaranteedSaveSix=true reduce E[D] cuando hay salvación posible', () => {
      // 4 ataques, BH3+, F4 vs R4, save 3+, AP0 → E[heridas] = 4×(5/6)×(3/6) ≈ 1
      // Con 1 herida pre-salvada, E[D] debe bajar
      const withSave: CombatParams = { ...BASE, attacks: 4, baseSave: 3, ap: 0 };
      const { result: r1 } = renderHook(() => useCombat(withSave));
      const { result: r2 } = renderHook(() => useCombat({ ...withSave, guaranteedSaveSix: true }));
      expect(r2.current.expectedDamage).toBeLessThan(r1.current.expectedDamage);
    });

    it('guaranteedSaveSix=false produce el mismo resultado que omitirlo', () => {
      const { result: r1 } = renderHook(() => useCombat(BASE));
      const { result: r2 } = renderHook(() => useCombat({ ...BASE, guaranteedSaveSix: false }));
      expect(r2.current.expectedDamage).toBeCloseTo(r1.current.expectedDamage, 8);
    });
  });
});
