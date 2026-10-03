import { describe, expect, it } from 'vitest';
import { resolveRerollPolicy, updateRerollSelection } from './rerollPolicy';
import { WH40K_PRESETS } from './presets';

describe('reroll selection', () => {
  it('uses one policy, prioritizes non-sixes and suppresses hit rerolls for Torrent', () => {
    expect(resolveRerollPolicy()).toBe('none');
    expect(resolveRerollPolicy(true)).toBe('failures');
    expect(resolveRerollPolicy(false, true)).toBe('nonSixes');
    expect(resolveRerollPolicy(true, true)).toBe('nonSixes');
    expect(resolveRerollPolicy(true, true, true)).toBe('none');
  });

  it('updates one stage atomically without changing the other stage or mutating the input', () => {
    const original = { ...WH40K_PRESETS[0].params, hitRerollAll: true, woundRerollAll: true };
    const fishing = updateRerollSelection(original, 'hit', 'nonSixes', true);
    expect(fishing.hitRerollAll).toBe(false);
    expect(fishing.hitRerollNonSixes).toBe(true);
    expect(fishing.woundRerollAll).toBe(true);
    expect(original.hitRerollAll).toBe(true);
    const failures = updateRerollSelection(fishing, 'hit', 'failures', true);
    expect(failures.hitRerollNonSixes).toBe(false);
    expect(failures.hitRerollAll).toBe(true);
    expect(updateRerollSelection(failures, 'hit', 'failures', false).hitRerollAll).toBe(false);
  });
});
