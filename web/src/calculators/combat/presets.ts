/**
 * Presets de combate WH40K 10ª edición para demostración.
 *
 * Cada preset cubre una mecánica distinta del pipeline para que sea fácil
 * enseñar cómo cada habilidad cambia el perfil de daño:
 *
 *  1. Bólter vs Marine    — estadística base, sin habilidades especiales
 *  2. Bólter Pesado       — Sustained Hits: los 6 naturales generan impactos extra
 *  3. Puño de Poder       — alta F y FP con penalizador a impactar (-1 BH)
 *  4. Plasma Sobreinflado — Devastating Wounds: 6 natural al herir bypasea armadura
 *  5. Lascañón vs Rhino   — daño variable D6 contra blindado T9 2+
 */

/** Parámetros planos del combate. Tipos primitivos, sin dependencias del dominio. */
export interface CombatParams {
  attacks:      number;
  /** Si true, el número de ataques es D6 en lugar del valor fijo. */
  attacksD6?:   boolean;
  hitThreshold: number;
  /** If true, failed hit rolls are rerolled once. */
  hitRerollAll?: boolean;
  /** If true, one hit die is already showing a natural 6. */
  guaranteedHitSix?: boolean;
  strength:     number;
  /** If true, failed wound rolls are rerolled once. */
  woundRerollAll?: boolean;
  /** If true, one wound die is already showing a natural 6. */
  guaranteedWoundSix?: boolean;
  ap:           number;
  /** Valor fijo de daño. Ignorado si damageD6=true. */
  damage:       number;
  /** Si true, el daño es D6 en lugar del valor fijo. */
  damageD6?:    boolean;
  /** If true, one damage die is already showing a natural 6. */
  guaranteedDamageSix?: boolean;
  /**
   * Bonificador constante que se añade a cada tirada de daño.
   * Permite expresar perfiles como D6+2 o H2+1.
   */
  damageBonus?: number;
  /** Si true, el arma impacta automáticamente sin tirada (Torrent/lanzallamas). */
  torrent?:     boolean;
  toughness:    number;
  /** Target wounds used to derive elimination probability from the damage distribution. */
  targetWounds: number;
  baseSave:     number;
  invulnerableSave?: number;
  fnpThreshold?:     number;
  /**
   * If true, one save die is already showing a natural 6 (auto-save).
   * That die removes one wound from the pool before any normal save rolls.
   */
  guaranteedSaveSix?: boolean;
  sustainedHits?:    number;
  lethalHits?:       boolean;
  devastatingWounds?: boolean;
  mortalWoundsPerHit?: number;
}

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
    name:        'Bolter vs Marine',
    description: 'El duelo más icónico: Space Marine contra Space Marine. Sin reglas especiales — es la referencia para entender el pipeline base: impactar en 3+, herir con F4 vs R4 en 4+, fallar salvación 3+ con FP0 = fallar en 4+.',
    params: { attacks: 2, hitThreshold: 3, strength: 4, ap: 0, damage: 1, toughness: 4, targetWounds: 2, baseSave: 3 },
  },
  {
    id:          'heavy-bolter-sustained',
    name:        'Bolter Pesado — Sustained Hits 1',
    description: 'Igual que el Bolter pero con más ataques, FP-1 y la regla Sustained Hits: cada 6 natural al impactar genera 1 impacto extra. El extra NO es crítico — no puede encadenar más Sustained Hits.',
    ability:     'Impactos Sostenidos 1: un 6 natural genera +1 impacto (no crítico).',
    params: { attacks: 3, hitThreshold: 3, strength: 5, ap: 1, damage: 2, toughness: 4, targetWounds: 2, baseSave: 3, sustainedHits: 1 },
  },
  {
    id:          'power-fist',
    name:        'Puño de Poder vs Marine',
    description: 'Combate cuerpo a cuerpo de élite. La penalización -1 BH (impactar en 4+ en lugar de 3+) se compensa con F6, FP-2 y H2. Muestra cómo impactar peor puede valer la pena si el daño por herida es mayor.',
    params: { attacks: 3, hitThreshold: 4, strength: 6, ap: 2, damage: 2, toughness: 4, targetWounds: 2, baseSave: 3 },
  },
  {
    id:          'plasma-overcharged',
    name:        'Plasma Sobreinflado — Devastating Wounds',
    description: 'Un 6 natural al herir inflige heridas mortales que ignoran armadura e invulnerable por completo. Aunque solo se dispare 1 ataque, la mecánica puede ser devastadora contra objetivos con buena salvación.',
    ability:     'Heridas Devastadoras: un 6 natural al herir convierte la herida en heridas mortales (bypasea saves).',
    params: { attacks: 1, hitThreshold: 3, strength: 8, ap: 3, damage: 2, toughness: 4, targetWounds: 2, baseSave: 3, devastatingWounds: true },
  },
  {
    id:          'lascannon-vs-rhino',
    name:        'Lascañon vs Rhino (T9 2+)',
    description: 'Arma antitanque pesada con daño variable D6. El FP-3 reduce la salvación 2+ del Rhino a 5+. Al tener daño D6, el perfil de resultados se extiende mucho más que con daño fijo — comprueba la distribución.',
    params: { attacks: 1, hitThreshold: 3, strength: 9, ap: 3, damage: 1, damageD6: true, toughness: 9, targetWounds: 10, baseSave: 2 },
  },
  {
    id:          'flamer-torrent',
    name:        'Lanzallamas — Torrent D6',
    description: 'Arma Torrent: todos los ataques impactan automáticamente, sin tirada de impactar. El número de ataques es D6 (varía 1–6 cada vez que se usa). La habilidad Torrent elimina Stage 1 del pipeline por completo.',
    ability:     'Torrent: todos los ataques son impactos automáticos — no se tira para impactar.',
    params: { attacks: 1, attacksD6: true, hitThreshold: 2, strength: 4, ap: 0, damage: 1, toughness: 4, targetWounds: 2, baseSave: 4, torrent: true },
  },
];
