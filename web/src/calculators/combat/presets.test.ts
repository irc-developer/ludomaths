/**
 * Tests de integridad de los presets de WH40K.
 *
 * Contrato verificado:
 * - Todos los presets tienen los campos obligatorios con valores en rango.
 * - No hay IDs duplicados (unicidad necesaria para la clave React).
 * - Ningún preset lanza una excepción al ejecutarse en el pipeline.
 *
 * Nota de diseño: los tests de presets son tests de datos, no de lógica.
 * Su valor está en detectar regresiones cuando se añaden o modifican presets
 * sin pasar por el ciclo Red-Green-Refactor.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { WH40K_PRESETS } from './presets';
import { useCombat } from './useCombat';

describe('WH40K_PRESETS', () => {
  it('contiene exactamente 6 presets', () => {
    expect(WH40K_PRESETS).toHaveLength(6);
  });

  it('no hay IDs duplicados', () => {
    const ids = WH40K_PRESETS.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('todos los presets tienen id, name, description y params', () => {
    for (const preset of WH40K_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.params).toBeDefined();
    }
  });

  it('los parámetros de arma están dentro de rango válido', () => {
    for (const { id, params } of WH40K_PRESETS) {
      expect(params.attacks, `${id}: attacks`).toBeGreaterThan(0);
      expect(params.hitThreshold, `${id}: hitThreshold`).toBeGreaterThanOrEqual(2);
      expect(params.hitThreshold, `${id}: hitThreshold`).toBeLessThanOrEqual(6);
      expect(params.strength, `${id}: strength`).toBeGreaterThan(0);
      expect(params.ap, `${id}: ap`).toBeGreaterThanOrEqual(0);
      expect(params.damage, `${id}: damage`).toBeGreaterThan(0);
      expect(params.toughness, `${id}: toughness`).toBeGreaterThan(0);
      expect(params.targetWounds, `${id}: targetWounds`).toBeGreaterThan(0);
      expect(params.baseSave, `${id}: baseSave`).toBeGreaterThanOrEqual(2);
    }
  });

  it('ningún preset lanza excepción al ejecutarse en el pipeline', () => {
    for (const preset of WH40K_PRESETS) {
      const { result } = renderHook(() => useCombat(preset.params));
      expect(result.current.error, `preset '${preset.id}' no debería dar error`).toBeUndefined();
      expect(result.current.expectedDamage, `preset '${preset.id}'`).toBeGreaterThanOrEqual(0);
    }
  });
});
