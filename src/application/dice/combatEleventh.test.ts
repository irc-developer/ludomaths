import { CalculateUnitCombatUseCase } from './CalculateUnitCombatUseCase';
import { CalculateRoundsToKillUseCase } from './CalculateRoundsToKillUseCase';
import { WeaponGroup } from '@domain/dice/weapon';

const fixed = (value: number) => [{ value, probability: 1 }];
const weapon: WeaponGroup = { attacksDist: fixed(1), modelCount: 1, hitThreshold: 6,
  strengthDist: fixed(8), ap: 10, damageDist: fixed(1), sustainedHits: 1 };
const target = { toughness: 4, savePools: [{ baseSave: 6, fraction: 1 }] };

describe('eleventh edition single miniature calculations', () => {
  it('keeps the original critical and its sustained hit in the same branch', () => {
    const result = new CalculateUnitCombatUseCase().execute({ weaponGroups: [weapon], ...target });
    // P(two damage) = P(critical hit) * P(two successful wounds) = 1/6 * (5/6)^2.
    expect(result.totalDamageDist.find(entry => entry.value === 2)?.probability).toBeCloseTo(25 / 216, 12);
    expect(result.totalDamageDist.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(1, 12);
  });

  it('does not apply an armor modifier to an invulnerable save', () => {
    const result = new CalculateUnitCombatUseCase().execute({
      weaponGroups: [{ ...weapon, sustainedHits: 0, torrent: true }], toughness: 4,
      savePools: [{ baseSave: 6, fraction: 1, invulnerableSave: 4, saveModifier: -1 }],
    });
    expect(result.totalDamageDist.find(entry => entry.value === 1)?.probability).toBeCloseTo(5 / 12, 12);
  });

  it('computes the exact geometric mean even with a short displayed horizon', () => {
    const result = new CalculateRoundsToKillUseCase().execute({
      weaponGroups: [{ ...weapon, hitThreshold: 4, strengthDist: fixed(4), sustainedHits: 0 }],
      ...target, targetWounds: 1, maxRounds: 2,
    });
    expect(result.expectedRounds).toBeCloseTo(4, 12);
  });

  it('reports infinite expected rounds when damage is impossible', () => {
    const result = new CalculateRoundsToKillUseCase().execute({
      weaponGroups: [{ ...weapon, modelCount: 0 }], ...target, targetWounds: 1, maxRounds: 2,
    });
    expect(result.expectedRounds).toBe(Infinity);
  });

  it('allows Lethal originals to roll wounds instead of automatically wounding', () => {
    const calculate = (lethalChoice: 'autoWound' | 'rollToWound') => new CalculateUnitCombatUseCase().execute({
      weaponGroups: [{ ...weapon, sustainedHits: 0, strengthDist: fixed(4), ap: 0,
        lethalHits: true, lethalChoice, devastatingWounds: true }],
      toughness: 4, savePools: [{ baseSave: 2, fraction: 1 }],
    }).totalDamageDist.find(entry => entry.value === 1)?.probability;
    expect(calculate('rollToWound')).toBeCloseTo(1 / 27, 12);
    expect(calculate('autoWound')).toBeCloseTo(1 / 36, 12);
  });
});
