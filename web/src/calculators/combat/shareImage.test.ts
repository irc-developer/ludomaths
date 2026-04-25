import { describe, expect, it } from 'vitest';
import type { CombatViewModel } from './useCombat';
import type { CombatParams } from './presets';
import { buildCombatShareSvg, isCombatShareImageSupported } from './shareImage';

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
  ],
};

describe('buildCombatShareSvg', () => {
  it('genera una tarjeta SVG con KPIs, distribucion y contexto no redundante', () => {
    const params: CombatParams = {
      attacks: 3,
      hitThreshold: 3,
      hitRerollAll: true,
      strength: 5,
      ap: 1,
      damage: 1,
      damageD6: true,
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

    const svg = buildCombatShareSvg({
      params,
      vm: BASE_VM,
      presetName: 'Bolter Pesado',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('LUDOMATHS');
    expect(svg).toContain('Bolter Pesado');
    expect(svg).toContain('P(eliminar objetivo de 3W)');
    expect(svg).toContain('Daño más probable');
    expect(svg).toContain('Rango central (Q1-Q3)');
    expect(svg).toContain('Distribución completa de daño total entero');
    expect(svg).toContain('24.1%');
    expect(svg).toContain('PERFIL');
    expect(svg).toContain('OBJETIVO');
    expect(svg).toContain('REGLAS');
    expect(svg).not.toContain('RESULTADOS');
  });
});

describe('isCombatShareImageSupported', () => {
  it('devuelve false cuando el navegador no soporta ClipboardItem o write', () => {
    expect(isCombatShareImageSupported({ clipboard: undefined, clipboardItem: undefined })).toBe(false);
    expect(isCombatShareImageSupported({ clipboard: { writeText: async () => undefined }, clipboardItem: undefined })).toBe(false);
  });

  it('devuelve true cuando write y ClipboardItem estan disponibles', () => {
    expect(
      isCombatShareImageSupported({
        clipboard: { write: async () => undefined },
        clipboardItem: class ClipboardItemMock {},
      }),
    ).toBe(true);
  });
});