/** Educational examples; these are not official weapon profiles. */

/** Parámetros planos del combate. Tipos primitivos, sin dependencias del dominio. */
export type { CombatScenarioInput as CombatParams } from '@application/dice/combatScenario';
import type { CombatScenarioInput as CombatParams } from '@application/dice/combatScenario';

export interface CombatPreset {
  id:          string;
  name:        string;
  /** Descripción pedagógica del preset para enseñar la mecánica. */
  description: string;
  /** Regla especial activa, si la hay. */
  ability?:    string;
  params:      CombatParams;
}

export const WH40K_PRESETS: CombatPreset[] = [
  {
    id:          'bolter-vs-marine',
    name:        'Ejemplo básico',
    description: 'Ejemplo pedagógico para explorar la distribución; no representa un perfil oficial.',
    params: { attacks: 2, hitThreshold: 3, strength: 4, ap: 0, damage: 1, toughness: 4, targetWounds: 2, baseSave: 3 },
  },
  {
    id:          'heavy-bolter-sustained',
    name:        'Ejemplo: impactos sostenidos',
    description: 'Ejemplo pedagógico para explorar la distribución; no representa un perfil oficial.',
    ability:     'Impactos Sostenidos 1: un 6 natural genera +1 impacto (no crítico).',
    params: { attacks: 3, hitThreshold: 3, strength: 5, ap: 1, damage: 2, toughness: 4, targetWounds: 2, baseSave: 3, sustainedHits: 1 },
  },
  {
    id:          'power-fist',
    name:        'Ejemplo: fuerza y penetración',
    description: 'Ejemplo pedagógico para explorar la distribución; no representa un perfil oficial.',
    params: { attacks: 3, hitThreshold: 4, strength: 6, ap: 2, damage: 2, toughness: 4, targetWounds: 2, baseSave: 3 },
  },
  {
    id:          'plasma-overcharged',
    name:        'Ejemplo: heridas devastadoras',
    description: 'Ejemplo pedagógico para explorar la distribución; no representa un perfil oficial.',
    ability:     'Heridas Devastadoras: un 6 natural al herir convierte la herida en heridas mortales (bypasea saves).',
    params: { attacks: 1, hitThreshold: 3, strength: 8, ap: 3, damage: 2, toughness: 4, targetWounds: 2, baseSave: 3, devastatingWounds: true },
  },
  {
    id:          'lascannon-vs-rhino',
    name:        'Ejemplo: daño variable',
    description: 'Ejemplo pedagógico para explorar la distribución; no representa un perfil oficial.',
    params: { attacks: 1, hitThreshold: 3, strength: 9, ap: 3, damage: 1, damageD6: true, toughness: 9, targetWounds: 10, baseSave: 2 },
  },
  {
    id:          'flamer-torrent',
    name:        'Ejemplo: impactos automáticos',
    description: 'Ejemplo pedagógico para explorar la distribución; no representa un perfil oficial.',
    ability:     'Torrent: todos los ataques son impactos automáticos — no se tira para impactar.',
    params: { attacks: 1, attacksD6: true, hitThreshold: 2, strength: 4, ap: 0, damage: 1, toughness: 4, targetWounds: 2, baseSave: 4, torrent: true },
  },
];
