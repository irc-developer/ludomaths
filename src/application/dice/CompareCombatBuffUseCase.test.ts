import { expectedValue } from '@domain/math/distribution';
import type { UnitProfile } from '@domain/profiles/unitProfile';
import { CompareCombatBuffUseCase } from './CompareCombatBuffUseCase';

const useCase = new CompareCombatBuffUseCase();

function makeDefender(overrides: Partial<UnitProfile> = {}): UnitProfile {
  return {
    name: 'Target',
    weaponGroups: [],
    wounds: 12,
    toughness: 4,
    savePools: [{ baseSave: 6, fraction: 1 }],
    ...overrides,
  };
}

function makeAttacker(overrides: Partial<UnitProfile> = {}): UnitProfile {
  return {
    name: 'Shooter',
    wounds: 10,
    toughness: 4,
    savePools: [{ baseSave: 3, fraction: 1 }],
    weaponGroups: [
      {
        attacksDist: [{ value: 4, probability: 1 }],
        hitThreshold: 4,
        strengthDist: [{ value: 4, probability: 1 }],
        ap: 1,
        damageDist: [{ value: 1, probability: 1 }],
        modelCount: 1,
      },
    ],
    ...overrides,
  };
}

describe('CompareCombatBuffUseCase', () => {
  it('recommends +1 ballistic skill when save, armor penetration and damage are already saturated', () => {
    const attacker = makeAttacker({
      weaponGroups: [
        {
          attacksDist: [{ value: 4, probability: 1 }],
          hitThreshold: 4,
          strengthDist: [{ value: 10, probability: 1 }],
          ap: 4,
          damageDist: [{ value: 6, probability: 1 }],
          modelCount: 1,
        },
      ],
    });
    const defender = makeDefender({ toughness: 3, savePools: [{ baseSave: 6, fraction: 1 }] });

    const result = useCase.execute({ attacker, defender });

    expect(result.recommendedOption).toBe('ballisticSkill');
    expect(result.plusBallisticSkill.expectedDamage).toBeGreaterThan(result.plusSave.expectedDamage);
    expect(result.plusBallisticSkill.expectedDamage).toBeGreaterThan(result.plusArmorPenetration.expectedDamage);
    expect(result.plusBallisticSkill.expectedDamage).toBeGreaterThan(result.plusDamage.expectedDamage);
  });

  it('recommends +1 armor penetration when save improvement is the biggest lever', () => {
    const attacker = makeAttacker({
      weaponGroups: [
        {
          attacksDist: [{ value: 1, probability: 1 }],
          hitThreshold: 2,
          strengthDist: [{ value: 10, probability: 1 }],
          ap: 0,
          damageDist: [{ value: 6, probability: 1 }],
          modelCount: 1,
        },
      ],
    });
    const defender = makeDefender({ toughness: 3, savePools: [{ baseSave: 2, fraction: 1 }] });

    const result = useCase.execute({ attacker, defender });

    expect(result.recommendedOption).toBe('armorPenetration');
    expect(result.plusArmorPenetration.expectedDamage).toBeGreaterThan(result.plusBallisticSkill.expectedDamage);
    expect(result.plusArmorPenetration.expectedDamage).toBeGreaterThan(result.plusSave.expectedDamage);
    expect(result.plusArmorPenetration.expectedDamage).toBeGreaterThan(result.plusDamage.expectedDamage);
  });

  it('applies +1 save by improving the defender armor characteristic when saves matter', () => {
    const attacker = makeAttacker({
      weaponGroups: [
        {
          attacksDist: [{ value: 4, probability: 1 }],
          hitThreshold: 2,
          strengthDist: [{ value: 10, probability: 1 }],
          ap: 0,
          damageDist: [{ value: 2, probability: 1 }],
          modelCount: 1,
        },
      ],
    });
    const defender = makeDefender({ toughness: 5, savePools: [{ baseSave: 4, fraction: 1 }] });

    const result = useCase.execute({ attacker, defender });

    expect(result.plusSave.expectedDamage).toBeLessThan(result.baseline.expectedDamage);
    expect(result.plusSave.expectedRoundsToKill).toBeGreaterThan(result.baseline.expectedRoundsToKill);
  });

  it('recommends +1 damage when hit, wound and save are already maxed out', () => {
    const attacker = makeAttacker({
      weaponGroups: [
        {
          attacksDist: [{ value: 3, probability: 1 }],
          hitThreshold: 2,
          strengthDist: [{ value: 10, probability: 1 }],
          ap: 4,
          damageDist: [{ value: 1, probability: 1 }],
          modelCount: 1,
        },
      ],
    });
    const defender = makeDefender({ toughness: 3, savePools: [{ baseSave: 6, fraction: 1 }] });

    const result = useCase.execute({ attacker, defender });

    expect(result.recommendedOption).toBe('damage');
    expect(result.plusDamage.expectedDamage).toBeGreaterThan(result.plusBallisticSkill.expectedDamage);
    expect(result.plusDamage.expectedDamage).toBeGreaterThan(result.plusSave.expectedDamage);
    expect(result.plusDamage.expectedDamage).toBeGreaterThan(result.plusArmorPenetration.expectedDamage);
    expect(result.baseline.expectedDamage).toBeCloseTo(expectedValue(result.baseline.damagePerRoundDist), 10);
  });
});