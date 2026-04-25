import { describe, expect, it } from 'vitest';
import type { CombatViewModel } from './useCombat';
import type { CombatParams } from './presets';
import { formatCombatShareText } from './share';

const BASE_VM: CombatViewModel = {
  expectedDamage: 2.345,
  medianDamage: 2,
  mostLikelyDamage: 1,
  centralRange: { low: 1, high: 4 },
  pAtLeastOne: 0.812,
  pEliminate: 0.423,
  distribution: [
    { value: 0, probability: 0.188 },
    { value: 1, probability: 0.241 },
    { value: 2, probability: 0.226 },
    { value: 3, probability: 0.15 },
    { value: 4, probability: 0.09 },
    { value: 5, probability: 0.05 },
    { value: 6, probability: 0.03 },
    { value: 7, probability: 0.015 },
    { value: 8, probability: 0.01 },
  ],
};

describe('formatCombatShareText', () => {
  it('genera un resumen legible para WhatsApp con secciones cortas y resultados agrupados', () => {
    const params: CombatParams = {
      attacks: 3,
      hitThreshold: 3,
      hitRerollAll: true,
      guaranteedHitSix: true,
      strength: 5,
      woundRerollAll: true,
      ap: 1,
      damage: 1,
      damageD6: true,
      guaranteedDamageSix: true,
      damageBonus: 2,
      toughness: 4,
      targetWounds: 3,
      baseSave: 3,
      invulnerableSave: 4,
      fnpThreshold: 5,
      sustainedHits: 1,
      lethalHits: true,
      devastatingWounds: true,
    };

    const text = formatCombatShareText({
      params,
      vm: BASE_VM,
      presetName: 'Bolter Pesado',
    });

    expect(text).not.toContain('+---');
    expect(text).toContain('LUDOMATHS - COMBATE WH40K');
    expect(text).toContain('Preset: Bolter Pesado');
    expect(text).toContain('PERFIL');
    expect(text).toContain('A3 | BH 3+ | F5 | FP-1 | D6+2');
    expect(text).toContain('OBJETIVO');
    expect(text).toContain('R4 | 3W | SA 3+ | Inv 4++ | FNP 5+');
    expect(text).toContain('REGLAS');
    expect(text).toContain('- Repetir fallos al impactar');
    expect(text).toContain('- 1 daño fijo en 6 natural');
    expect(text).toContain('RESULTADOS');
    expect(text).toContain('- P(eliminar 3W): 42.3%');
    expect(text).toContain('- Daño esperado: 2.35');
    expect(text).toContain('DISTRIBUCION');
    expect(text).toContain('- 0 daño: 18.8%');
  });

  it('escribe "sin reglas especiales" cuando no hay modificadores activos', () => {
    const params: CombatParams = {
      attacks: 2,
      hitThreshold: 4,
      strength: 4,
      ap: 0,
      damage: 1,
      toughness: 4,
      targetWounds: 2,
      baseSave: 4,
    };

    const text = formatCombatShareText({
      params,
      vm: BASE_VM,
    });

    expect(text).toContain('REGLAS');
    expect(text).toContain('- sin reglas especiales');
    expect(text).toContain('A2 | BH 4+ | F4 | FP-0 | D1');
    expect(text).toContain('R4 | 2W | SA 4+');
  });
});