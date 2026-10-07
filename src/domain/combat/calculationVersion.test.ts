import { COMBAT_ENGINE_VERSION, canRecalculateRecord } from './calculationVersion';

describe('calculation revision compatibility', () => {
  it('requires an explicit matching own engine revision', () => {
    expect(canRecalculateRecord({})).toBe(false);
    expect(canRecalculateRecord({ engineVersion: 'previous' })).toBe(false);
    expect(canRecalculateRecord({ engineVersion: COMBAT_ENGINE_VERSION })).toBe(true);
  });
});
