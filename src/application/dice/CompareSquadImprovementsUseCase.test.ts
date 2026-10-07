import { CompareSquadImprovementsUseCase } from './CompareSquadImprovementsUseCase';
describe('squad improvements', () => {
  it('ranks damage using actual casualties and separates a defensive save improvement', () => {
    const result = new CompareSquadImprovementsUseCase().execute({
      weaponGroups: [{ modelCount: 5, attacksDist: [{ value: 2, probability: 1 }], hitThreshold: 3,
        strengthDist: [{ value: 4, probability: 1 }], ap: 0, damageDist: [{ value: 1, probability: 1 }] }],
      defenders: [{ count: 5, woundsMax: 2, toughness: 4, baseSave: 3 }],
    });
    expect(result.plusDamage.expectedCasualties).toBeGreaterThan(result.baseline.expectedCasualties);
    expect(result.plusSave.expectedCasualties).toBeLessThan(result.baseline.expectedCasualties);
    expect(result.plusHitRoll.pEliminate).toBeGreaterThanOrEqual(result.baseline.pEliminate);
    expect(result.recommendedOption).not.toBe('save');
  });
});
