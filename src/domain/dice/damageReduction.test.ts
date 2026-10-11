import { reduceDamage } from './damageReduction';

describe('per-attack damage reduction', () => {
  it('merges variable damage outcomes at the minimum of one and preserves mass', () => {
    expect(reduceDamage([
      { value: 1, probability: .25 }, { value: 2, probability: .25 },
      { value: 3, probability: .25 }, { value: 4, probability: .25 },
    ], 2)).toEqual([{ value: 1, probability: .75 }, { value: 2, probability: .25 }]);
  });
  it('preserves zero damage and treats an absent or zero reduction as unchanged', () => {
    const dist = [{ value: 0, probability: .5 }, { value: 3, probability: .5 }];
    expect(reduceDamage(dist)).toEqual(dist);
    expect(reduceDamage(dist, 0)).toEqual(dist);
    expect(reduceDamage(dist, 100)).toEqual([{ value: 0, probability: .5 }, { value: 1, probability: .5 }]);
  });
  it.each([-1, .5, NaN, Infinity, 101])('rejects invalid reduction %s', reduction => {
    expect(() => reduceDamage([{ value: 3, probability: 1 }], reduction)).toThrow(RangeError);
  });
});
