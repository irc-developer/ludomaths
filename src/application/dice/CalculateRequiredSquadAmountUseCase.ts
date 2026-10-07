import { CalculateSquadCombatUseCase, type SquadCombatInput } from './CalculateSquadCombatUseCase';
export type SquadAmountUnit = 'attacks' | 'models' | 'activations';
export interface RequiredSquadResult {
  status: 'success' | 'impossible' | 'limit'; count: number; probability: number; previousProbability: number;
  unit: SquadAmountUnit; reason?: 'noFiniteGuarantee' | 'complexity';
}
export class CalculateRequiredSquadAmountUseCase {
  execute({ scenario, goal, successProbability, unit }: { scenario: SquadCombatInput; goal: number; successProbability: number; unit: SquadAmountUnit }): RequiredSquadResult {
    const engine = new CalculateSquadCombatUseCase();
    if (!Number.isInteger(goal) || goal < 1 || goal > scenario.defenders.reduce((sum, g) => sum + g.count, 0)) throw new RangeError('SQUAD_INVALID_INPUT');
    if (!Number.isFinite(successProbability) || successProbability <= 0 || successProbability > 1) throw new RangeError('SQUAD_INVALID_INPUT');
    if (unit !== 'activations' && scenario.weaponGroups.length !== 1) throw new RangeError('SQUAD_INVALID_INPUT');
    // Validate the scenario even when a 100% request is impossible.
    engine.execute(scenario);
    if (successProbability === 1) return { status: 'impossible', count: 0, probability: 0, previousProbability: 0, unit, reason: 'noFiniteGuarantee' };
    const hitsPerWeapon = scenario.weaponGroups.map(w => (w.torrent ? 1 : 1 + (w.sustainedHits ?? 0)) *
      Math.max(...w.attacksDist.map(e => e.value)));
    const hitsPerAmount = unit === 'attacks' ? (scenario.weaponGroups[0].torrent ? 1 : 1 + (scenario.weaponGroups[0].sustainedHits ?? 0))
      : unit === 'models' ? hitsPerWeapon[0]
        : hitsPerWeapon.reduce((sum, hits, i) => sum + hits * scenario.weaponGroups[i].modelCount, 0);
    const maximum = Math.min(unit === 'attacks' ? 300 : unit === 'models' ? 100 : 20, Math.floor(300 / hitsPerAmount));
    const cache = new Map<number, number>([[0, 0]]);
    const probability = (count: number) => {
      const saved = cache.get(count); if (saved !== undefined) return saved;
      const weaponGroups = unit === 'activations' ? scenario.weaponGroups
        : [{ ...scenario.weaponGroups[0], modelCount: unit === 'models' ? count : 1,
          ...(unit === 'attacks' ? { attacksDist: [{ value: count, probability: 1 }] } : {}) }];
      const result = engine.execute({ ...scenario, weaponGroups, activations: unit === 'activations' ? count : 1 });
      const p = result.casualtiesDist.filter(e => e.value >= goal).reduce((sum, e) => sum + e.probability, 0);
      cache.set(count, p); return p;
    };
    let checked = 0; let checkedProbability = 0;
    try {
      let high = 1; let low = 0;
      while (true) {
        const p = probability(high); checked = high; checkedProbability = p;
        if (p >= successProbability) break;
        if (high === maximum) return { status: 'limit', count: high, probability: p, previousProbability: probability(high - 1), unit };
        low = high; high = Math.min(maximum, high * 2);
      }
      while (high - low > 1) {
        const middle = Math.floor((high + low) / 2);
        if (probability(middle) >= successProbability) high = middle; else low = middle;
      }
      return { status: 'success', count: high, probability: probability(high), previousProbability: probability(high - 1), unit };
    } catch (error) {
      if (error instanceof Error && ['SQUAD_COMPLEXITY_LIMIT', 'SQUAD_NUMERICAL_LIMIT'].includes(error.message)) {
        return { status: 'limit', count: checked, probability: checkedProbability, previousProbability: cache.get(Math.max(0, checked - 1)) ?? 0, unit, reason: 'complexity' };
      }
      throw error;
    }
  }
}
