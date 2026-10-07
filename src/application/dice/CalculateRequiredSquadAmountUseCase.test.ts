import { CalculateRequiredSquadAmountUseCase } from './CalculateRequiredSquadAmountUseCase';
import type { SquadCombatInput } from './CalculateSquadCombatUseCase';
const scenario: SquadCombatInput = {
  weaponGroups: [{ modelCount: 1, attacksDist: [{ value: 2, probability: 1 }], hitThreshold: 6,
    strengthDist: [{ value: 4, probability: 1 }], ap: 6, damageDist: [{ value: 3, probability: 1 }], lethalHits: true }],
  defenders: [{ count: 2, woundsMax: 2, toughness: 4, baseSave: 3 }],
};
describe('required squad amounts', () => {
  it('finds the minimum and checks the previous amount', () => {
    const result = new CalculateRequiredSquadAmountUseCase().execute({ scenario, goal: 2, successProbability: .5, unit: 'attacks' });
    expect(result.status).toBe('success');
    expect(result.probability).toBeGreaterThanOrEqual(.5);
    expect(result.previousProbability).toBeLessThan(.5);
  });
  it('counts complete models including their attacks', () => {
    const useCase = new CalculateRequiredSquadAmountUseCase();
    const attacks = useCase.execute({ scenario, goal: 2, successProbability: .5, unit: 'attacks' });
    const models = useCase.execute({ scenario, goal: 2, successProbability: .5, unit: 'models' });
    expect(models.count).toBe(Math.ceil(attacks.count / 2));
  });
  it('returns impossible for a finite 100 percent guarantee and validates the goal', () => {
    expect(new CalculateRequiredSquadAmountUseCase().execute({ scenario, goal: 2, successProbability: 1, unit: 'attacks' }).status).toBe('impossible');
    expect(() => new CalculateRequiredSquadAmountUseCase().execute({ scenario, goal: 3, successProbability: .5, unit: 'attacks' })).toThrow();
  });
  it('searches the feasible boundary when doubling would exceed the hit budget', () => {
    const variable: SquadCombatInput = { ...scenario,
      weaponGroups: [{ ...scenario.weaponGroups[0], attacksDist: [{ value: 10, probability: 1 }] }],
      defenders: [{ ...scenario.defenders[0], count: 30 }],
    };
    const result = new CalculateRequiredSquadAmountUseCase().execute({ scenario: variable, goal: 30, successProbability: .5, unit: 'models' });
    expect(result.status).toBe('success');
    expect(result.count).toBeGreaterThan(16);
    expect(result.count).toBeLessThanOrEqual(30);
    expect(result.previousProbability).toBeLessThan(.5);
  });
});
