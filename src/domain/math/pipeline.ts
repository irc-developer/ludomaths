/**
 * @module pipeline
 *
 * Compound probability operations for multi-stage random processes.
 *
 * Both functions here model situations where the input to one probabilistic
 * stage is itself a random variable — not a fixed number. This is the key
 * mathematical abstraction behind the Warhammer 40K combat pipeline (and any
 * other game with chained dice rolls).
 */

import { binomialDistribution } from './binomial';
import { multiConvolve } from './convolution';
import { Distribution, ProbabilityEntry } from './distribution';

/**
 * Applies a single Bernoulli stage to a distribution of trial counts.
 *
 * Given that the number of trials N is itself a random variable (described by
 * `trialsDist`), and each trial independently succeeds with probability p,
 * this returns the distribution of the total number of successes S:
 *
 *   P(S = s) = Σₙ P(N = n) · P(Binomial(n, p) = s)
 *
 * This is the compound binomial distribution. It generalizes
 * `binomialDistribution` to the case where n is not fixed.
 *
 * In the combat pipeline:
 * - Stage hits → wounds: trialsDist = hit distribution, p = wound probability.
 * - Stage wounds → unsaved: trialsDist = wound distribution, p = fail-save probability.
 *
 * @param trialsDist - Distribution of trial counts. Values must be
 *   non-negative integers (enforced indirectly by `binomialDistribution`).
 * @param p - Per-trial success probability. Must be in [0, 1].
 * @returns Distribution of the total number of successes.
 *
 * @throws {RangeError} If p is outside [0, 1].
 *
 * @example
 * // Wounds from a hit distribution of Bin(3, 2/3) with wound-on-4+ (p=0.5)
 * const hitDist = binomialDistribution(3, 2/3);
 * const woundDist = applyStage(hitDist, 0.5);
 */
export function applyStage(trialsDist: Distribution, p: number): Distribution {
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError(`applyStage: p must be in [0, 1], got ${p}`);
  }

  // P(S = s) = Σₙ P(N = n) · P(Binomial(n, p) = s)
  const accumulated = new Map<number, number>();

  for (const { value: n, probability: pTrials } of trialsDist) {
    const successDist = binomialDistribution(n, p);
    for (const { value: s, probability: pSuccess } of successDist) {
      accumulated.set(s, (accumulated.get(s) ?? 0) + pTrials * pSuccess);
    }
  }

  return Array.from(accumulated.entries())
    .filter(([, prob]) => prob > 0)
    .map(([value, probability]) => ({ value, probability }))
    .sort((a, b) => a.value - b.value);
}

/**
 * Computes the total damage distribution from a distribution of unsaved wounds,
 * where each wound deals a variable amount of damage.
 *
 * For each possible number of wounds k, the total damage is the sum of k
 * independent copies of `damageDist`. This is a randomly stopped sum:
 *
 *   P(D = d) = Σₖ P(wounds = k) · P(multiConvolve(damageDist, k) = d)
 *
 * When k = 0 (no wounds), total damage is always 0.
 *
 * @param woundDist  - Distribution of unsaved wound counts. Values must be
 *   non-negative integers.
 * @param damageDist - Distribution of damage dealt per single wound.
 * @returns Distribution of the total damage across all wounds.
 *
 * @example
 * // 3 unsaved wounds with D3 damage each
 * const damageDist = discreteProbability([{value:1,weight:1},{value:2,weight:1},{value:3,weight:1}]);
 * const woundDist  = [{ value: 3, probability: 1 }];
 * applyDamage(woundDist, damageDist); // distribution of 3D3
 */
export function applyDamage(
  woundDist: Distribution,
  damageDist: Distribution,
): Distribution {
  // P(D = d) = Σₖ P(wounds = k) · P(multiConvolve(damageDist, k) = d)
  const accumulated = new Map<number, number>();

  for (const { value: k, probability: pWound } of woundDist) {
    // multiConvolve handles k=0 by returning [{value:0, probability:1}].
    const totalDamageDist = multiConvolve(damageDist, k);
    for (const { value: d, probability: pDamage } of totalDamageDist) {
      accumulated.set(d, (accumulated.get(d) ?? 0) + pWound * pDamage);
    }
  }

  const result: ProbabilityEntry[] = [];
  for (const [value, probability] of accumulated) {
    if (probability > 0) {
      result.push({ value, probability });
    }
  }
  return result.sort((a, b) => a.value - b.value);
}
