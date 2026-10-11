import type { Distribution } from '../math/distribution';

/** Reduce each attack's damage characteristic before FNP, with a minimum of one. */
export function reduceDamage(dist: Distribution, reduction = 0): Distribution {
  if (!Number.isInteger(reduction) || reduction < 0 || reduction > 100) {
    throw new RangeError('Invalid damage reduction');
  }
  if (reduction === 0) return dist;
  const mass = new Map<number, number>();
  for (const { value, probability } of dist) {
    const reduced = value === 0 ? 0 : Math.max(1, value - reduction);
    mass.set(reduced, (mass.get(reduced) ?? 0) + probability);
  }
  return [...mass].sort((a, b) => a[0] - b[0]).map(([value, probability]) => ({ value, probability }));
}
