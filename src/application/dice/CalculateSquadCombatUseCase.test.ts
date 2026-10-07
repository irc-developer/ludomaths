import { CalculateSquadCombatUseCase } from './CalculateSquadCombatUseCase';
import type { WeaponGroup } from '@domain/dice/weapon';
import { CalculateUnitCombatUseCase } from './CalculateUnitCombatUseCase';

const weapon: WeaponGroup = { modelCount: 1, attacksDist: [{ value: 1, probability: 1 }],
  strengthDist: [{ value: 8, probability: 1 }], damageDist: [{ value: 3, probability: 1 }],
  hitThreshold: 2, torrent: true, woundReroll: 'failures', ap: 6 };
const defender = { count: 5, woundsMax: 2, toughness: 4, baseSave: 3 };
const useCase = new CalculateSquadCombatUseCase();

describe('exact squad allocation', () => {
  it('loses excess damage per packet rather than treating the squad as a wound bucket', () => {
    const result = useCase.execute({ weaponGroups: [weapon], defenders: [defender] });
    expect(result.casualtiesDist.map(e => e.value)).toEqual([0, 1]);
    expect(result.casualtiesDist[0].probability).toBeCloseTo(1 / 36, 12);
    expect(result.casualtiesDist[1].probability).toBeCloseTo(35 / 36, 12);
    expect(result.expectedWoundsLost).toBeCloseTo(2 * 35 / 36);
    expect(result.pEliminate).toBe(0);
  });
  it('keeps sustained originals and extras correlated while allocating separate packets', () => {
    const result = useCase.execute({ weaponGroups: [{ ...weapon, torrent: false, hitThreshold: 6,
      lethalHits: true, sustainedHits: 1 }], defenders: [{ ...defender, count: 2 }] });
    expect(result.casualtiesDist.find(e => e.value === 2)?.probability).toBeCloseTo(35 / 216);
    expect(result.casualtiesDist.find(e => e.value === 1)?.probability).toBeCloseTo(1 / 216);
    expect(result.casualtiesDist.find(e => e.value === 0)?.probability).toBeCloseTo(5 / 6);
  });
  it('finishes an injured model before damaging the next model', () => {
    const result = useCase.execute({ weaponGroups: [{ ...weapon, damageDist: [{ value: 1, probability: 1 }] }],
      defenders: [{ ...defender, firstModelWounds: 1 }] });
    expect(result.expectedCasualties).toBeCloseTo(35 / 36);
    expect(result.expectedWoundsLost).toBeCloseTo(35 / 36);
  });
  it('resolves sorted save faces against the current group, not independent save fractions', () => {
    const result = useCase.execute({ weaponGroups: [{ ...weapon, attacksDist: [{ value: 2, probability: 1 }],
      damageDist: [{ value: 1, probability: 1 }], ap: 0, lethalHits: true, torrent: false, hitThreshold: 6 }],
      defenders: [{ count: 1, woundsMax: 1, toughness: 4, baseSave: 2 },
        { count: 1, woundsMax: 1, toughness: 4, baseSave: 6 }] });
    // Both must hit (1/36); sorted faces must include a 1 and have maximum <=5 (9/36).
    expect(result.pEliminate).toBeCloseTo(9 / 1296, 12);
  });
  it('applies normal damage before devastating packets and caps each devastating packet', () => {
    const result = useCase.execute({ weaponGroups: [{ ...weapon, attacksDist: [{ value: 2, probability: 1 }],
      devastatingWounds: true }], defenders: [{ ...defender, count: 3 }] });
    expect(result.casualtiesDist.some(e => e.value > 2)).toBe(false);
    expect(result.casualtiesDist.reduce((sum, e) => sum + e.probability, 0)).toBeCloseTo(1, 12);
  });
  it('uses the highest living toughness during each weapon group wound stage', () => {
    const result = useCase.execute({ weaponGroups: [{ ...weapon, woundReroll: 'none' }], defenders: [defender,
      { ...defender, count: 1, toughness: 16 }] });
    expect(result.expectedCasualties).toBeCloseTo(1 / 6);
  });
  it('retains mass for variable attacks and FNP with several weapon groups', () => {
    const result = useCase.execute({ weaponGroups: [{ ...weapon, attacksDist: [{ value: 1, probability: .5 }, { value: 2, probability: .5 }] }, weapon],
      defenders: [{ ...defender, fnpThreshold: 5 }] });
    expect(result.casualtiesDist.reduce((sum, e) => sum + e.probability, 0)).toBeCloseTo(1, 12);
    expect(result.woundsLostDist.reduce((sum, e) => sum + e.probability, 0)).toBeCloseTo(1, 12);
    expect(result.expectedWoundsLost).toBeLessThanOrEqual(10);
  });
  it('checks character and wounded group priorities and resource limits', () => {
    expect(() => useCase.execute({ weaponGroups: [weapon], defenders: [{ ...defender, count: 1, isCharacter: true }, defender] })).toThrow();
    expect(() => useCase.execute({ weaponGroups: [weapon], defenders: [defender, { ...defender, firstModelWounds: 1 }] })).toThrow();
    expect(() => useCase.execute({ weaponGroups: [weapon], defenders: [defender], maxOperations: 1 })).toThrow('SQUAD_COMPLEXITY_LIMIT');
  });
  it('gathers identical attacks from separate equipment groups into one save batch', () => {
    const w = { ...weapon, damageDist: [{ value: 1, probability: 1 }], ap: 0, lethalHits: true, torrent: false, hitThreshold: 6 };
    const targets = [{ count: 1, woundsMax: 1, toughness: 4, baseSave: 2 }, { count: 1, woundsMax: 1, toughness: 4, baseSave: 6 }];
    const together = useCase.execute({ weaponGroups: [{ ...w, modelCount: 2 }], defenders: targets });
    const separate = useCase.execute({ weaponGroups: [w, w], defenders: targets });
    expect(separate.pEliminate).toBeCloseTo(together.pEliminate, 12);
  });
  it('matches independent exhaustive hit/save enumeration for mixed defenders', () => {
    const w = { ...weapon, attacksDist: [{ value: 2, probability: 1 }], damageDist: [{ value: 1, probability: 1 }],
      ap: 0, lethalHits: true, torrent: false, hitThreshold: 6 };
    const expected = [0, 0, 0];
    const enumerate = (hits: number, faces: number[], weight: number) => {
      if (faces.length < hits) { for (let f = 1; f <= 6; f++) enumerate(hits, [...faces, f], weight / 6); return; }
      let killed = 0;
      for (const face of [...faces].sort((a, b) => a - b)) {
        if (killed < 2 && face < (killed === 0 ? 2 : 6)) killed++;
      }
      expected[killed] += weight;
    };
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) enumerate(Number(a === 6) + Number(b === 6), [], 1 / 36);
    const result = useCase.execute({ weaponGroups: [w], defenders: [{ count: 1, woundsMax: 1, toughness: 4, baseSave: 2 },
      { count: 1, woundsMax: 1, toughness: 4, baseSave: 6 }] });
    for (const e of result.casualtiesDist) expect(e.probability).toBeCloseTo(expected[e.value], 12);
  });
  it.each([5, 10, 20])('preserves probability mass for %i participating models', count => {
    const result = useCase.execute({ weaponGroups: [{ ...weapon, torrent: false, hitThreshold: 3, sustainedHits: 1,
      devastatingWounds: true, modelCount: count, attacksDist: [{ value: 2, probability: 1 }], ap: 1,
      damageDist: [{ value: 2, probability: 1 }] }], defenders: [{ ...defender, count, fnpThreshold: 5 }] });
    expect(result.casualtiesDist.reduce((sum, e) => sum + e.probability, 0)).toBeCloseTo(1, 10);
    expect(result.expectedCasualties).toBeLessThanOrEqual(count);
  });
  it('agrees with the existing exact single-model loss distribution', () => {
    const w = { ...weapon, torrent: false, hitThreshold: 3, sustainedHits: 1, lethalHits: true, devastatingWounds: true,
      modelCount: 2, damageDist: [{ value: 1, probability: .5 }, { value: 3, probability: .5 }] };
    const target = { ...defender, count: 1, woundsMax: 5, fnpThreshold: 5 };
    const old = new CalculateUnitCombatUseCase().execute({ weaponGroups: [w], toughness: target.toughness,
      savePools: [{ ...target, fraction: 1 }] });
    const expected = new Map<number, number>();
    for (const e of old.totalDamageDist) expected.set(Math.min(5, e.value), (expected.get(Math.min(5, e.value)) ?? 0) + e.probability);
    const current = useCase.execute({ weaponGroups: [w], defenders: [target] });
    for (const e of current.woundsLostDist) expect(e.probability).toBeCloseTo(expected.get(e.value)!, 12);
  });
});
