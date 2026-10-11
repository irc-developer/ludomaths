import { buildCombatScenario } from './combatScenario';
import { CalculateUnitCombatUseCase } from './CalculateUnitCombatUseCase';
import { CalculateRequiredAttacksUseCase } from './CalculateRequiredAttacksUseCase';
import { CompareCombatBuffUseCase } from './CompareCombatBuffUseCase';
import { singleAttackDamage } from '@domain/dice/attackDamage';

const input = { attacks: 2, hitThreshold: 3, strength: 4, ap: 1, damage: 1,
  toughness: 4, targetWounds: 2, baseSave: 3 };

describe('shared combat scenario', () => {
  it('reduces sustained damage separately for each hit and preserves additional mortals', () => {
    const { weapon, target } = buildCombatScenario({ ...input, attacks: 1, hitThreshold: 6, strength: 8,
      ap: 6, damage: 3, damageReduction: 2, lethalHits: true, sustainedHits: 1 });
    const dist = singleAttackDamage(weapon, target);
    expect(dist.map(e => e.value)).toEqual([0, 1, 2]);
    expect(dist[0].probability).toBeCloseTo(5 / 6, 12);
    expect(dist[1].probability).toBeCloseTo(1 / 36, 12);
    expect(dist[2].probability).toBeCloseTo(5 / 36, 12);
    const mortals = singleAttackDamage({ ...weapon, torrent: true, mortalWoundsPerHit: 2 }, target);
    expect(mortals.map(e => e.value)).toEqual([2, 3]);
    expect(mortals[0].probability).toBeCloseTo(1 / 6, 12);
    expect(mortals[1].probability).toBeCloseTo(5 / 6, 12);
  });
  it('also reduces observed damage dice before applying FNP', () => {
    const { weapon, target } = buildCombatScenario({ ...input, attacks: 1, torrent: true,
      guaranteedWoundSix: true, damageD6: true, guaranteedDamageSix: true,
      damageBonus: 1, damageReduction: 5, ap: 6, fnpThreshold: 4 });
    const result = new CalculateUnitCombatUseCase().execute({ weaponGroups: [weapon], toughness: target.toughness,
      savePools: [{ ...target, fraction: 1 }] });
    expect(result.totalDamageDist).toEqual([
      { value: 0, probability: .25 }, { value: 1, probability: .5 }, { value: 2, probability: .25 },
    ]);
  });
  it('reduces each damage roll after bonuses and before FNP in every calculator', () => {
    const { weapon, target } = buildCombatScenario({ ...input, attacks: 1, damageExpression: 'D3',
      damageBonus: 1, melta: 1, withinHalfRange: true, damageReduction: 3,
      torrent: true, strength: 8, ap: 6, targetWounds: 1, fnpThreshold: 4 });
    const expected = [{ value: 0, probability: 37 / 72 }, { value: 1, probability: 5 / 12 }, { value: 2, probability: 5 / 72 }];
    const combat = new CalculateUnitCombatUseCase().execute({ weaponGroups: [weapon], toughness: target.toughness,
      savePools: [{ ...target, fraction: 1 }] });
    expect(combat.totalDamageDist).toHaveLength(expected.length);
    for (const [i, entry] of combat.totalDamageDist.entries()) {
      expect(entry.value).toBe(expected[i].value);
      expect(entry.probability).toBeCloseTo(expected[i].probability, 12);
    }
    expect(combat.totalDamageDist.reduce((sum, e) => sum + e.probability, 0)).toBeCloseTo(1, 12);
    const required = new CalculateRequiredAttacksUseCase().execute({ weapon, target, targetWounds: 1, successProbability: .5 });
    expect(required.attacks).toBe(2);
    expect(required.previousProbability).toBeCloseTo(35 / 72, 12);
    expect(required.probability).toBeCloseTo(1 - (37 / 72) ** 2, 12);
    const comparison = new CompareCombatBuffUseCase().execute({
      attacker: { name: 'Attacker', wounds: 1, toughness: 1, savePools: [{ fraction: 1, baseSave: 6 }], weaponGroups: [weapon] },
      defender: { name: 'Defender', wounds: 1, toughness: target.toughness, savePools: [{ ...target, fraction: 1 }], weaponGroups: [] },
    });
    expect(comparison.baseline.damagePerRoundDist).toEqual(combat.totalDamageDist);
  });
  it.each([-1, .5, NaN, 101])('rejects invalid damage reduction %s', damageReduction => {
    expect(() => buildCombatScenario({ ...input, damageReduction })).toThrow();
  });
  it('keeps attacks per carrier and applies cover to ranged BS', () => {
    const result = buildCombatScenario({ ...input, attacksExpression: 'D3', modelCount: 2, cover: true });
    expect(result.weapon.modelCount).toBe(2);
    expect(result.weapon.attacksDist).toHaveLength(3);
    expect(result.weapon.hitThreshold).toBe(4);
    expect(result.target.baseSave).toBe(3);
  });
  it('requires every Heavy condition and separates intrinsic and conditional bonuses', () => {
    const result = buildCombatScenario({ ...input, heavy: true, rapidFire: 2, melta: 2,
      withinHalfRange: true, damageExpression: 'D3+1', phase: 'shooting', engaged: false,
      setUpThisTurn: false, movedOverThree: false });
    expect(result.weapon.hitModifier).toBe(1);
    expect(result.weapon.attacksDist[0].value).toBe(4);
    expect(result.weapon.damageDist[0].value).toBe(4);
    expect(() => buildCombatScenario({ ...input, heavy: true })).toThrow();
  });
  it('rejects impossible remaining wounds and excessive combined complexity', () => {
    expect(() => buildCombatScenario({ ...input, woundsMax: 1 })).toThrow();
    expect(() => buildCombatScenario({ ...input, attacks: 100, damage: 100, modelCount: 100 })).toThrow();
  });
});
