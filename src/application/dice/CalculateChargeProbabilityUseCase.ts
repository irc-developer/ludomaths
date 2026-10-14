/**
 * Probability of rolling enough distance for one standard WH40K charge target.
 * Eligibility and a viable movement path must be checked by the caller.
 * Only additive charge-roll modifiers are supported; movement-distance effects
 * and rules replacing dice need separate reviewed models.
 */
import { Distribution, discreteProbability } from '@domain/math/distribution';
import { multiConvolve } from '@domain/math/convolution';

export interface ChargeInput {
  /** Measured distance in inches, preserved without rounding. */
  distance: number;
  /** Requires permission to re-roll the entire charge roll, at most once. */
  reroll?: 'none' | 'failures';
  /** A die was observed as 6; the other die is still unknown. Not a dice-fixing ability. */
  observedSix?: boolean;
  /** Authorized additive modifier, applied after any re-roll. */
  chargeRollModifier?: number;
}

interface ChargeDistributions {
  /** Natural initial roll: 2D6, or D6+6 when conditioned on an observed six. */
  rollDist: Distribution;
  /** Initial roll after the additive modifier and the charge-roll limits. */
  modifiedRollDist: Distribution;
}

export type ChargeResult = ChargeDistributions & (
  | { status: 'ready'; probability: number }
  | { status: 'outsideRange' | 'checkEngagement'; probability: null }
);

const D6 = discreteProbability(Array.from({ length: 6 }, (_, i) => ({ value: i + 1, weight: 1 })));
// Convolution accounts for all 36 equiprobable pairs.
const TWO_D6 = multiConvolve(D6, 2);
const D6_PLUS_6 = D6.map(entry => ({ ...entry, value: entry.value + 6 }));

function modifyRoll(dist: Distribution, modifier: number): Distribution {
  const masses = new Map<number, number>();
  for (const entry of dist) {
    const value = Math.max(1, Math.min(12, entry.value + modifier));
    masses.set(value, (masses.get(value) ?? 0) + entry.probability);
  }
  return [...masses].map(([value, probability]) => ({ value, probability }));
}

function sufficientDistance(dist: Distribution, distance: number): number {
  return Math.max(0, Math.min(1, dist.reduce(
    (sum, entry) => sum + (entry.value >= distance ? entry.probability : 0), 0,
  )));
}

export class CalculateChargeProbabilityUseCase {
  execute(input: ChargeInput): ChargeResult {
    const { distance, reroll = 'none', observedSix = false, chargeRollModifier = 0 } = input;
    if (!Number.isFinite(distance) || distance <= 0) {
      throw new RangeError('La distancia debe ser un número finito mayor que 0.');
    }
    if (!Number.isSafeInteger(chargeRollModifier)) {
      throw new RangeError('El modificador de la tirada debe ser un número entero válido.');
    }
    if (reroll !== 'none' && reroll !== 'failures') {
      throw new RangeError('La repetición debe ser ninguna o una repetición completa.');
    }

    const rollDist = observedSix ? D6_PLUS_6 : TWO_D6;
    const modifiedRollDist = modifyRoll(rollDist, chargeRollModifier);
    const distributions = { rollDist, modifiedRollDist };
    // Target selection is limited independently of the dice modifier.
    if (distance > 12) return { ...distributions, status: 'outsideRange', probability: null };
    // At the same level this target is already engaged; heights need a separate model.
    if (distance <= 2) return { ...distributions, status: 'checkEngagement', probability: null };

    const initial = sufficientDistance(modifiedRollDist, distance);
    // A full re-roll loses the observed six and always returns to ordinary 2D6.
    const repeat = sufficientDistance(modifyRoll(TWO_D6, chargeRollModifier), distance);
    const probability = reroll === 'failures' ? initial + (1 - initial) * repeat : initial;
    return { ...distributions, status: 'ready', probability: Math.min(1, probability) };
  }
}
