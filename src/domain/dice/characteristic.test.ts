import { characteristicDistribution, parseSignedAp } from './characteristic';

describe('characteristic expressions', () => {
  it('retains the triangular distribution of two independent dice', () => {
    const dist = characteristicDistribution('2D6+1');
    expect(dist[0]).toEqual({ value: 3, probability: 1 / 36 });
    expect(dist.find(entry => entry.value === 8)?.probability).toBeCloseTo(1 / 6, 12);
    expect(dist[dist.length - 1]?.value).toBe(13);
  });
  it.each(['-', 'D8', '2D6-1', 'D6<script>', '11D6', 'D6+101', ''])('rejects unsupported expression %s', value => {
    expect(() => characteristicDistribution(value)).toThrow();
  });
  it('accepts zero or signed negative AP only', () => {
    expect(parseSignedAp('-3')).toBe(3);
    expect(parseSignedAp('0')).toBe(0);
    expect(() => parseSignedAp('3')).toThrow();
    expect(() => parseSignedAp('+3')).toThrow();
  });
});
