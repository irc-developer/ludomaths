import { CalculateRequiredAttacksUseCase, type RequiredAttacksInput } from './CalculateRequiredAttacksUseCase';
import { CalculateCombatResultUseCase } from './CalculateCombatResultUseCase';

const fixed = (value: number) => [{ value, probability: 1 }];
const BASE: RequiredAttacksInput = {
  weapon: { hitThreshold: 3, strengthDist: fixed(4), ap: 0, damageDist: fixed(1) },
  target: { toughness: 4, baseSave: 3 },
  targetWounds: 2,
  successProbability: 0.9,
};
const useCase = new CalculateRequiredAttacksUseCase();

describe('CalculateRequiredAttacksUseCase', () => {
  it('finds the minimum for a bolter vs a two-wound marine', () => {
    // Each attack wounds unsaved with p = 2/3 * 1/2 * 1/3 = 1/9.
    // P(kill) = 1 - (8/9)^n - n*(1/9)*(8/9)^(n-1).
    const result = useCase.execute(BASE);
    expect(result.status).toBe('success');
    expect(result.attacks).toBe(34);
    expect(result.probability).toBeCloseTo(1 - (8 / 9) ** 34 - 34 / 9 * (8 / 9) ** 33, 12);
    expect(result.probability).toBeGreaterThanOrEqual(0.9);
    expect(result.previousProbability).toBeLessThan(0.9);
  });

  it('agrees with the existing full pipeline for a basic variable-damage weapon with FNP', () => {
    const input = { ...BASE, weapon: { ...BASE.weapon, damageDist: [1, 2, 3].map(value => ({ value, probability: 1 / 3 })) }, target: { ...BASE.target, fnpThreshold: 5 } };
    const result = useCase.execute(input);
    const combat = new CalculateCombatResultUseCase();
    for (const [attacks, probability] of [[result.attacks, result.probability], [result.attacks - 1, result.previousProbability]]) {
      const dist = combat.execute({ ...input.weapon, ...input.target, attacksDist: fixed(attacks) }).totalDamageDist;
      expect(probability).toBeCloseTo(dist.filter(entry => entry.value >= 2).reduce((sum, entry) => sum + entry.probability, 0), 10);
    }
  });

  it('returns one attack when damage exceeds the remaining wounds', () => {
    const result = useCase.execute({ ...BASE, weapon: { ...BASE.weapon, torrent: true, strengthDist: fixed(8), ap: 6, damageDist: fixed(5) }, successProbability: 0.8 });
    expect(result.attacks).toBe(1);
    expect(result.probability).toBeCloseTo(5 / 6);
    expect(result.previousProbability).toBe(0);
  });

  it('honors an invulnerable save even when AP negates armor', () => {
    const weapon = { ...BASE.weapon, torrent: true, strengthDist: fixed(8), ap: 6, damageDist: fixed(2) };
    expect(useCase.execute({ ...BASE, weapon, target: { ...BASE.target, invulnerableSave: 4 } }).attacks)
      .toBeGreaterThan(useCase.execute({ ...BASE, weapon }).attacks);
  });

  it('keeps critical and ordinary hits mutually exclusive with lethal and sustained hits', () => {
    const result = useCase.execute({ ...BASE, weapon: { ...BASE.weapon, ap: 6, lethalHits: true, sustainedHits: 1 }, targetWounds: 2, successProbability: 0.04 });
    // Only a critical hit can do two damage: lethal original + an extra that wounds on 4+.
    expect(result.attacks).toBe(1);
    expect(result.probability).toBeCloseTo(1 / 6 * 1 / 2);
  });

  it('a devastating wound bypasses saves without creating a second wound', () => {
    const result = useCase.execute({ ...BASE, weapon: { ...BASE.weapon, devastatingWounds: true }, successProbability: 0.01 });
    expect(result.attacks).toBe(2);
    // One damage per attack, q = 2/3 * (1/6 + (2/6)*(1/3)) = 5/27.
    expect(result.probability).toBeCloseTo((5 / 27) ** 2);
  });

  it('rerolls and torrent change the minimum', () => {
    const baseline = useCase.execute(BASE).attacks;
    expect(useCase.execute({ ...BASE, weapon: { ...BASE.weapon, hitReroll: 'failures', woundReroll: 'failures' } }).attacks).toBeLessThan(baseline);
    const torrent = { ...BASE.weapon, torrent: true };
    expect(useCase.execute({ ...BASE, weapon: torrent }).attacks).toBeLessThan(baseline);
    expect(useCase.execute({ ...BASE, weapon: { ...torrent, lethalHits: true, sustainedHits: 2, hitReroll: 'nonSixes' } })).toEqual(useCase.execute({ ...BASE, weapon: torrent }));
  });

  it('does not claim a finite 100% guarantee when attacks can fail', () => {
    expect(useCase.execute({ ...BASE, successProbability: 1 }).status).toBe('impossible');
  });

  it('returns a finite 100% guarantee when every attack inflicts positive damage', () => {
    const result = useCase.execute({ ...BASE, weapon: { ...BASE.weapon, torrent: true, mortalWoundsPerHit: 1 }, successProbability: 1 });
    expect(result.status).toBe('success');
    expect(result.attacks).toBe(2);
    expect(result.probability).toBe(1);
  });

  it('distinguishes zero damage from exhausting the search limit', () => {
    expect(useCase.execute({ ...BASE, weapon: { ...BASE.weapon, damageDist: fixed(0) } }).status).toBe('impossible');
    const result = useCase.execute({ ...BASE, maxAttacks: 3 });
    expect(result.status).toBe('limit');
    expect(result.attacks).toBe(3);
    expect(result.probability).toBeLessThan(0.9);
  });

  it.each([0, -1, 1.5, NaN, Infinity, 501])('rejects invalid wounds: %s', targetWounds => {
    expect(() => useCase.execute({ ...BASE, targetWounds })).toThrow(RangeError);
  });

  it.each([0, -0.1, 1.1, NaN])('rejects invalid reliability: %s', successProbability => {
    expect(() => useCase.execute({ ...BASE, successProbability })).toThrow(RangeError);
  });

  it('validates weapon distributions and optional saves', () => {
    expect(() => useCase.execute({ ...BASE, weapon: { ...BASE.weapon, damageDist: [{ value: 1, probability: 0.5 }] } })).toThrow(RangeError);
    expect(() => useCase.execute({ ...BASE, target: { ...BASE.target, fnpThreshold: 1 } })).toThrow(RangeError);
    expect(() => useCase.execute({ ...BASE, maxAttacks: 0 })).toThrow(RangeError);
  });
});
