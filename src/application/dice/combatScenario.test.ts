import { buildCombatScenario } from './combatScenario';

const input = { attacks: 2, hitThreshold: 3, strength: 4, ap: 1, damage: 1,
  toughness: 4, targetWounds: 2, baseSave: 3 };

describe('shared combat scenario', () => {
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
