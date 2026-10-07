import { CompareCombatBuffUseCase } from './CompareCombatBuffUseCase';

describe('separate offensive and defensive improvements', () => {
  it('does not recommend wasted overkill against a one-wound miniature', () => {
    const fixed = (value: number) => [{ value, probability: 1 }];
    const result = new CompareCombatBuffUseCase().execute({ includeHitRoll: true,
      attacker: { name: 'Attacker', wounds: 1, toughness: 4, savePools: [{ baseSave: 3, fraction: 1 }],
        weaponGroups: [{ attacksDist: fixed(2), hitThreshold: 3, strengthDist: fixed(4), ap: 1, damageDist: fixed(1), modelCount: 1 }] },
      defender: { name: 'Target', wounds: 1, toughness: 4, weaponGroups: [], savePools: [{ baseSave: 5, invulnerableSave: 6, fraction: 1 }] },
    });
    expect(result.plusDamage.expectedWoundsLost).toBeCloseTo(result.baseline.expectedWoundsLost!, 12);
    expect(result.recommendedOption).toBe('equal');
  });
  it('distinguishes improving the skill characteristic from adding to the hit die', () => {
    const fixed = (value: number) => [{ value, probability: 1 }];
    const result = new CompareCombatBuffUseCase().execute({ includeHitRoll: true,
      attacker: { name: 'Attacker', wounds: 1, toughness: 4, savePools: [{ baseSave: 3, fraction: 1 }],
        weaponGroups: [{ attacksDist: fixed(1), hitThreshold: 2, hitModifier: -1, strengthDist: fixed(8), ap: 10, damageDist: fixed(1), modelCount: 1 }] },
      defender: { name: 'Target', wounds: 2, toughness: 4, weaponGroups: [], savePools: [{ baseSave: 3, fraction: 1 }] },
    });
    expect(result.plusBallisticSkill.expectedDamage).toBeCloseTo(result.baseline.expectedDamage, 12);
    expect(result.plusHitRoll!.expectedDamage - result.baseline.expectedDamage).toBeCloseTo(5 / 36, 12);
    expect(result.recommendedOption).not.toBe('save');
  });
});
