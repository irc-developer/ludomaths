import { expectedValue } from '@domain/math/distribution';
import type { WeaponGroup } from '@domain/dice/weapon';
import { CalculateUnitCombatUseCase } from './CalculateUnitCombatUseCase';
import { CalculateCombatResultUseCase } from './CalculateCombatResultUseCase';

const fixed = (value: number) => [{ value, probability: 1 }];
const weapon: WeaponGroup = {
  attacksDist: fixed(1), hitThreshold: 3, strengthDist: fixed(4),
  ap: 2, damageDist: fixed(1), modelCount: 1,
};
const useCase = new CalculateUnitCombatUseCase();

function calculate(changes: Partial<WeaponGroup> = {}, baseSave = 5, fnpThreshold?: number) {
  return useCase.execute({
    weaponGroups: [{ ...weapon, ...changes }], toughness: 4,
    savePools: [{ baseSave, fraction: 1, fnpThreshold }],
  }).totalDamageDist;
}

describe('combat reroll policies', () => {
  it.each<[Partial<WeaponGroup>, number]>([
    [{ hitReroll: 'nonSixes' }, (26 / 36) * (1 / 2)],
    [{ woundReroll: 'nonSixes' }, (4 / 6) * (21 / 36)],
    [{ hitReroll: 'nonSixes', woundReroll: 'nonSixes' }, (26 / 36) * (21 / 36)],
    [{ hitReroll: 'nonSixes', lethalHits: true }, 11 / 36 + (15 / 36) * (1 / 2)],
    [{ hitReroll: 'nonSixes', sustainedHits: 1 }, (37 / 36) * (1 / 2)],
    [{ hitReroll: 'nonSixes', sustainedHits: 1, lethalHits: true }, 11 / 36 + (26 / 36) * (1 / 2)],
    [{ hitReroll: 'failures', lethalHits: true }, 8 / 36 + (24 / 36) * (1 / 2)],
    [{ hitThreshold: 6, hitModifier: -1, hitReroll: 'nonSixes' }, (11 / 36) * (1 / 2)],
    [{ attacksDist: fixed(0), hitReroll: 'nonSixes', woundReroll: 'nonSixes' }, 0],
  ])('matches manually calculated mean damage for %j', (changes, mean) => {
    const dist = calculate(changes);
    expect(expectedValue(dist)).toBeCloseTo(mean, 12);
    expect(dist.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(1, 12);
  });

  it('preserves the exact Bernoulli distribution when neither stage splits critical rolls', () => {
    const p = (26 / 36) * (21 / 36);
    const dist = calculate({ hitReroll: 'nonSixes', woundReroll: 'nonSixes' });
    expect(dist.find(entry => entry.value === 0)?.probability).toBeCloseTo(1 - p, 12);
    expect(dist.find(entry => entry.value === 1)?.probability).toBeCloseTo(p, 12);
  });

  it.each(['nonSixes', 'failures'] as const)('uses contextual wound criticals with %s', woundReroll => {
    // AP0, save2+ -> failSave=1/6. At wound4+, nonSixes gives 11 crits + 10 normal /36.
    // Failures gives 9 crits + 18 normal /36. Torrent removes the hit roll.
    const dist = calculate({ torrent: true, ap: 0, devastatingWounds: true, woundReroll }, 2);
    const mean = woundReroll === 'nonSixes' ? (11 + 10 / 6) / 36 : (9 + 18 / 6) / 36;
    expect(expectedValue(dist)).toBeCloseTo(mean, 12);
  });

  it.each(['nonSixes', 'failures'] as const)('weights variable-strength successes and criticals with %s', woundReroll => {
    // Equal mixture of wound6+ and wound4+: nonSixes = 16 success, 11 crit /36;
    // failures = 19 success, 10 crit /36. Normal wounds fail save2+ with probability 1/6.
    const dist = calculate({
      torrent: true, ap: 0, devastatingWounds: true, woundReroll,
      strengthDist: [{ value: 2, probability: 0.5 }, { value: 4, probability: 0.5 }],
    }, 2);
    expect(expectedValue(dist)).toBeCloseTo(woundReroll === 'nonSixes' ? 71 / 216 : 23 / 72, 12);
  });

  it('does not reroll guaranteed sixes and keeps Lethal auto-wounds out of Devastating Wounds', () => {
    const changes: Partial<WeaponGroup> = {
      guaranteedHitSixes: 1, hitReroll: 'nonSixes', woundReroll: 'nonSixes',
      lethalHits: true, devastatingWounds: true, ap: 0,
    };
    expect(expectedValue(calculate(changes, 2))).toBeCloseTo(1 / 6, 12);
    expect(expectedValue(calculate({ torrent: true, guaranteedWoundSixes: 1, woundReroll: 'nonSixes', devastatingWounds: true, ap: 0 }, 2))).toBeCloseTo(1, 12);
  });

  it('ignores hit rerolls and hit critical abilities with Torrent, but still rerolls wounds', () => {
    expect(expectedValue(calculate({ torrent: true, hitReroll: 'nonSixes', woundReroll: 'nonSixes', lethalHits: true, sustainedHits: 2 }))).toBeCloseTo(21 / 36, 12);
  });

  it('applies FNP to damage from rerolled devastating wounds', () => {
    const changes: Partial<WeaponGroup> = { torrent: true, woundReroll: 'nonSixes', devastatingWounds: true, ap: 0 };
    expect(expectedValue(calculate(changes, 2, 5))).toBeCloseTo((76 / 216) * (2 / 3), 12);
  });

  it('passes both reroll policies through the single-weapon facade', () => {
    const dist = new CalculateCombatResultUseCase().execute({
      ...weapon, hitReroll: 'nonSixes', woundReroll: 'nonSixes', toughness: 4, baseSave: 5,
    }).totalDamageDist;
    expect(expectedValue(dist)).toBeCloseTo((26 / 36) * (21 / 36), 12);
  });
});
