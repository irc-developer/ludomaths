import { CalculateChargeProbabilityUseCase } from './CalculateChargeProbabilityUseCase';

const useCase = new CalculateChargeProbabilityUseCase();

describe('CalculateChargeProbabilityUseCase', () => {
  // ── Boundary distances ───────────────────────────────────────────────────

  it('returns 1 for distance 2 (minimum possible: 1+1)', () => {
    const { probability } = useCase.execute({ distance: 2 });
    expect(probability).toBeCloseTo(1);
  });

  it('returns probability ~0.028 for distance 12 (maximum: 6+6 only)', () => {
    // Only one outcome out of 36 reaches 12: (6,6)
    const { probability } = useCase.execute({ distance: 12 });
    expect(probability).toBeCloseTo(1 / 36);
  });

  it('returns 0 for distance 13 (impossible: 2D6 max is 12)', () => {
    const { probability } = useCase.execute({ distance: 13 });
    expect(probability).toBe(0);
  });

  // ── Known intermediate values ────────────────────────────────────────────

  it('returns ~0.583 for distance 7 (most likely failure point in game)', () => {
    // P(2D6 >= 7) = 21/36
    const { probability } = useCase.execute({ distance: 7 });
    expect(probability).toBeCloseTo(21 / 36);
  });

  it('returns ~0.278 for distance 9', () => {
    // P(2D6 >= 9): outcomes (3,6),(6,3),(4,5),(5,4),(4,6),(6,4),(5,5),(5,6),(6,5),(6,6) = 10
    const { probability } = useCase.execute({ distance: 9 });
    expect(probability).toBeCloseTo(10 / 36);
  });

  it('returns ~0.167 for distance 10', () => {
    // P(2D6 >= 10): (4,6),(6,4),(5,5),(5,6),(6,5),(6,6) = 6/36
    const { probability } = useCase.execute({ distance: 10 });
    expect(probability).toBeCloseTo(6 / 36);
  });

  // ── Monotonicity: higher distance → lower probability ───────────────────

  it('probability decreases as distance increases', () => {
    let prev = useCase.execute({ distance: 2 }).probability;
    for (let d = 3; d <= 12; d++) {
      const { probability } = useCase.execute({ distance: d });
      expect(probability).toBeLessThan(prev);
      prev = probability;
    }
  });

  // ── Full distribution is returned alongside probability ─────────────────

  it('returns the full 2D6 distribution', () => {
    const { rollDist } = useCase.execute({ distance: 7 });
    // 2D6 has 11 distinct values (2..12)
    expect(rollDist).toHaveLength(11);
    const total = rollDist.reduce((sum, e) => sum + e.probability, 0);
    expect(total).toBeCloseTo(1);
  });

  // ── Input validation ─────────────────────────────────────────────────────

  it('throws RangeError for distance < 2', () => {
    expect(() => useCase.execute({ distance: 1 })).toThrow(RangeError);
    expect(() => useCase.execute({ distance: 0 })).toThrow(RangeError);
  });

  it('throws RangeError for non-integer distance', () => {
    expect(() => useCase.execute({ distance: 5.5 })).toThrow(RangeError);
  });

  // ── Reroll ───────────────────────────────────────────────────────────────

  describe("reroll 'failures'", () => {
    it('increases probability of a successful charge', () => {
      const { probability: pBase } = useCase.execute({ distance: 9 });
      const { probability: pReroll } = useCase.execute({ distance: 9, reroll: 'failures' });
      expect(pReroll).toBeGreaterThan(pBase);
    });

    it('follows the formula p*(2-p)', () => {
      // P(2D6 ≥ 9) = 10/36; with reroll failures: p*(2-p)
      const p = 10 / 36;
      const { probability } = useCase.execute({ distance: 9, reroll: 'failures' });
      expect(probability).toBeCloseTo(p * (2 - p));
    });

    it('does not exceed 1 for any distance', () => {
      for (let d = 2; d <= 13; d++) {
        const { probability } = useCase.execute({ distance: d, reroll: 'failures' });
        expect(probability).toBeLessThanOrEqual(1);
        expect(probability).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── lockedSix ────────────────────────────────────────────────────────────

  describe('lockedSix (one die is pre-rolled as 6, effective roll is D6+6)', () => {
    it('guarantees charge for any distance ≤ 7 (D6 min is 1, so 6+1=7)', () => {
      for (let d = 2; d <= 7; d++) {
        const { probability } = useCase.execute({ distance: d, lockedSix: true });
        expect(probability).toBeCloseTo(1);
      }
    });

    it('returns ~0.667 for distance 9 (need D6 ≥ 3 → 4 out of 6)', () => {
      const { probability } = useCase.execute({ distance: 9, lockedSix: true });
      expect(probability).toBeCloseTo(4 / 6);
    });

    it('returns ~0.167 for distance 12 (need D6 ≥ 6 → 1 out of 6)', () => {
      const { probability } = useCase.execute({ distance: 12, lockedSix: true });
      expect(probability).toBeCloseTo(1 / 6);
    });

    it('returns 0 for distance 13 (D6+6 max is 12)', () => {
      const { probability } = useCase.execute({ distance: 13, lockedSix: true });
      expect(probability).toBeCloseTo(0, 10);
    });

    it('increases probability vs standard 2D6 for d=9', () => {
      const { probability: pStandard } = useCase.execute({ distance: 9 });
      const { probability: pLocked }   = useCase.execute({ distance: 9, lockedSix: true });
      expect(pLocked).toBeGreaterThan(pStandard);
    });

    it('returns the D6+6 distribution (6 entries, values 7–12)', () => {
      const { rollDist } = useCase.execute({ distance: 9, lockedSix: true });
      expect(rollDist).toHaveLength(6);
      expect(rollDist[0].value).toBe(7);
      expect(rollDist[rollDist.length - 1].value).toBe(12);
      const total = rollDist.reduce((sum, e) => sum + e.probability, 0);
      expect(total).toBeCloseTo(1);
    });

    it('combines with reroll failures: p*(2-p) on the D6+6 probability', () => {
      // P(D6+6 ≥ 9) = P(D6 ≥ 3) = 4/6
      const p = 4 / 6;
      const { probability } = useCase.execute({ distance: 9, lockedSix: true, reroll: 'failures' });
      expect(probability).toBeCloseTo(p * (2 - p));
    });
  });
});
