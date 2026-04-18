/**
 * @module savePool
 *
 * Domain type for a defensive save pool within a unit.
 *
 * A save pool groups models that share the same save characteristics.
 * Units where all models have the same save use a single pool with fraction=1.
 * Mixed units (e.g. some models with invulnerable saves, some without) use
 * multiple pools whose fractions must sum to 1.
 *
 * Lives in domain/dice because it encodes game concepts (armor save, AP,
 * invulnerable saves, Feel No Pain) that belong to the combat rules layer.
 */

import { DieRerollPolicy } from './combat';

/**
 * A pool of wounds directed at a subset of the defending unit.
 *
 * `fraction` is the proportion of total wounds routed to models in this pool.
 * All save pools in a unit must have fractions that sum to 1.
 */
export interface SavePool {
  /** Base armor save before modifiers (e.g. 3 means "3+"). Integer in [2, 6]. */
  baseSave: number;
  /** Proportion of wounds routed to this pool. Must be in (0, 1]. */
  fraction: number;
  /**
   * Unmodifiable save (e.g. 4++ invulnerable). Integer in [2, 6] when provided.
   * AP does not affect this value. The pipeline chooses the better of armor and invulnerable.
   */
  invulnerableSave?: number;
  /** Modifier applied to save rolls. Clamped to [−1, +1] per WH40K rules. Defaults to 0. */
  saveModifier?: number;
  /** Re-roll policy for save rolls. Defaults to 'none'. */
  saveReroll?: DieRerollPolicy;
  /**
   * Feel No Pain threshold. When provided, each point of damage that reaches
   * this pool is individually negated on a D6 roll ≥ fnpThreshold.
   * Stage 5 in the combat pipeline.
   */
  fnpThreshold?: number;
}
