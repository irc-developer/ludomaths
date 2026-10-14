import { CalculateChargeProbabilityUseCase, type ChargeInput } from './CalculateChargeProbabilityUseCase';

const useCase = new CalculateChargeProbabilityUseCase();
function probability(input: ChargeInput): number {
  const result = useCase.execute(input);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('Expected a calculable distance');
  return result.probability;
}

describe('CalculateChargeProbabilityUseCase', () => {
  it.each([
    [2.01, 35 / 36], [3, 35 / 36], [7, 21 / 36],
    [9, 10 / 36], [9.1, 6 / 36], [12, 1 / 36],
  ])('distance %s preserves the measured threshold', (distance, expected) => {
    expect(probability({ distance })).toBeCloseTo(expected, 12);
  });

  it.each([0.5, 1, 2])('distance %s requires engagement review rather than guaranteed success', distance => {
    expect(useCase.execute({ distance })).toMatchObject({ status: 'checkEngagement', probability: null });
  });

  it.each([12.01, 13, 30])('distance %s is outside target selection even with bonuses', distance => {
    expect(useCase.execute({ distance, chargeRollModifier: 20, reroll: 'failures', observedSix: true }))
      .toMatchObject({ status: 'outsideRange', probability: null });
  });

  it.each([NaN, Infinity, -Infinity, 0, -1])('rejects invalid distance %s', distance => {
    expect(() => useCase.execute({ distance })).toThrow(RangeError);
  });

  it.each([NaN, Infinity, -Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid modifier %s', chargeRollModifier => {
    expect(() => useCase.execute({ distance: 9, chargeRollModifier })).toThrow(RangeError);
  });

  it('rejects an unknown re-roll policy', () => {
    expect(() => useCase.execute({ distance: 9, reroll: 'all' as 'none' })).toThrow(RangeError);
  });

  it('a positive modifier can make double one sufficient; it is not an automatic failure', () => {
    expect(probability({ distance: 3, chargeRollModifier: 1 })).toBeCloseTo(1, 12);
  });

  it('handles negative modifiers without applying the hit/wound modifier limit', () => {
    expect(probability({ distance: 9, chargeRollModifier: -2 })).toBeCloseTo(3 / 36, 12);
    expect(probability({ distance: 9, chargeRollModifier: 2 })).toBeCloseTo(21 / 36, 12);
  });

  it('caps the modified charge roll at 12 and aggregates the upper outcomes', () => {
    const result = useCase.execute({ distance: 12, chargeRollModifier: 2 });
    expect(result.modifiedRollDist.find(entry => entry.value === 12)?.probability).toBeCloseTo(6 / 36, 12);
    expect(probability({ distance: 12, chargeRollModifier: 2 })).toBeCloseTo(6 / 36, 12);
    expect(result.modifiedRollDist.every(entry => entry.value <= 12)).toBe(true);
    // The natural distribution is not overwritten by the modifier.
    expect(result.rollDist.find(entry => entry.value === 12)?.probability).toBeCloseTo(1 / 36, 12);
  });

  it('floors modified rolls at 1 without turning them into legal short charges', () => {
    const result = useCase.execute({ distance: 3, chargeRollModifier: -20 });
    expect(result.modifiedRollDist).toHaveLength(1);
    expect(result.modifiedRollDist[0].value).toBe(1);
    expect(result.modifiedRollDist[0].probability).toBeCloseTo(1, 12);
    expect(result.probability).toBe(0);
    expect(result.status).toBe('ready');
  });

  it('a full re-roll gives 155/324 at 9 inches', () => {
    expect(probability({ distance: 9, reroll: 'failures' })).toBeCloseTo(155 / 324, 12);
  });

  it('applies modifiers after each full re-roll', () => {
    // With +1 at 9 inches each attempt reaches the target on natural 8+ (15/36).
    expect(probability({ distance: 9, chargeRollModifier: 1, reroll: 'failures' })).toBeCloseTo(95 / 144, 12);
  });

  it('conditions only the first roll on an observed six', () => {
    expect(probability({ distance: 9, observedSix: true })).toBeCloseTo(4 / 6, 12);
    // First attempt: 4/6; full repeat: 10/36, losing the observed six.
    expect(probability({ distance: 9, observedSix: true, reroll: 'failures' })).toBeCloseTo(41 / 54, 12);
    expect(probability({ distance: 12, observedSix: true, reroll: 'failures' })).toBeCloseTo(41 / 216, 12);
  });

  it('does not re-roll a sufficient conditioned result', () => {
    expect(probability({ distance: 7, observedSix: true, reroll: 'failures' })).toBeCloseTo(1, 12);
  });

  it('keeps natural and modified distributions normalized and probabilities bounded', () => {
    for (const observedSix of [false, true]) {
      for (const chargeRollModifier of [-20, -2, 0, 2, 20]) {
        let previous = 1;
        for (let distance = 3; distance <= 12; distance++) {
          const result = useCase.execute({ distance, chargeRollModifier, observedSix, reroll: 'failures' });
          expect(result.rollDist.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(1, 12);
          expect(result.modifiedRollDist.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(1, 12);
          expect(result.modifiedRollDist.every(entry => entry.value >= 1 && entry.value <= 12)).toBe(true);
          if (result.status !== 'ready') throw new Error('Expected ready');
          expect(result.probability).toBeGreaterThanOrEqual(0);
          expect(result.probability).toBeLessThanOrEqual(previous + 1e-12);
          previous = result.probability;
        }
      }
    }
  });
});
