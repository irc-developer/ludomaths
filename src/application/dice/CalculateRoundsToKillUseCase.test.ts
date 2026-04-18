import { Distribution, cumulativeProbability, expectedValue } from '@domain/math/distribution';
import { CalculateRoundsToKillUseCase, RoundsToKillInput } from './CalculateRoundsToKillUseCase';
import { CalculateUnitCombatUseCase } from './CalculateUnitCombatUseCase';

// ── Helpers ────────────────────────────────────────────────────────────────

function fixed(value: number): Distribution {
  return [{ value, probability: 1 }];
}

// ── Standard fixture ───────────────────────────────────────────────────────
//
// 1 attack, hit 4+ (p = 1/2), S4 vs T4 → wound 4+ (p = 1/2),
// AP-5 against baseSave 2 → effectiveSave 7 (impossible, failSave = 1),
// damage 1.
//
//   P(deal ≥1 damage per round) = 1/2 × 1/2 = 1/4
//
// For a 1W target this is a geometric distribution with p = 1/4:
//   E[rounds to kill] = 1/p = 4
//   P(kill by round 1) = 1/4

const STANDARD_INPUT: RoundsToKillInput = {
  weaponGroups: [{
    attacksDist:  fixed(1),
    hitThreshold: 4,
    strengthDist: fixed(4),
    ap:           5,
    damageDist:   fixed(1),
    modelCount:   1,
  }],
  toughness:    4,
  savePools:    [{ baseSave: 2, fraction: 1 }],
  targetWounds: 1,
  maxRounds:    60,   // P(T > 60) = (3/4)^60 ≈ 0, truncation error is negligible
};

const useCase = new CalculateRoundsToKillUseCase();

// ── Contract ───────────────────────────────────────────────────────────────

describe('CalculateRoundsToKillUseCase', () => {

  describe('killByRound structure', () => {
    it('returns at most maxRounds entries', () => {
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      expect(killByRound.length).toBeLessThanOrEqual(STANDARD_INPUT.maxRounds);
    });

    it('round numbers are consecutive starting at 1', () => {
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      killByRound.forEach(({ round }, i) => {
        expect(round).toBe(i + 1);
      });
    });

    it('cumulativeProbability is non-decreasing', () => {
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      for (let i = 1; i < killByRound.length; i++) {
        expect(killByRound[i].cumulativeProbability).toBeGreaterThanOrEqual(
          killByRound[i - 1].cumulativeProbability,
        );
      }
    });

    it('cumulativeProbability is always in [0, 1]', () => {
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      killByRound.forEach(({ cumulativeProbability: cp }) => {
        expect(cp).toBeGreaterThanOrEqual(0);
        expect(cp).toBeLessThanOrEqual(1 + 1e-9);
      });
    });

    it('probability[n] equals cumulativeProbability[n] − cumulativeProbability[n−1]', () => {
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      killByRound.forEach(({ probability, cumulativeProbability: cp }, i) => {
        const prevCp = i === 0 ? 0 : killByRound[i - 1].cumulativeProbability;
        expect(probability).toBeCloseTo(cp - prevCp);
      });
    });

    it('all individual probabilities are non-negative', () => {
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      killByRound.forEach(({ probability }) => {
        expect(probability).toBeGreaterThanOrEqual(-1e-9);
      });
    });
  });

  // ── Known-value tests (geometric distribution) ─────────────────────────

  describe('known-value: geometric distribution (1W target, p = 1/4 per round)', () => {
    it('P(kill by round 1) = 1/4', () => {
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      expect(killByRound[0].cumulativeProbability).toBeCloseTo(1 / 4);
    });

    it('P(kill by round 2) = 1 − (3/4)²', () => {
      // Geometric CDF: P(T ≤ n) = 1 − (1−p)^n, p = 1/4
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      expect(killByRound[1].cumulativeProbability).toBeCloseTo(1 - (3 / 4) ** 2);
    });

    it('expectedRounds ≈ 4 (= 1/p for geometric with p = 1/4)', () => {
      // With maxRounds=60, truncation error ≈ (3/4)^60 × 60 ≈ 1.5e-6 — negligible.
      const { expectedRounds } = useCase.execute(STANDARD_INPUT);
      expect(expectedRounds).toBeCloseTo(4, 3);
    });

    it('P(kill in round N) matches geometric PMF: p × (1−p)^(N−1)', () => {
      const p = 1 / 4;
      const { killByRound } = useCase.execute(STANDARD_INPUT);
      [1, 2, 3, 5, 10].forEach(n => {
        const entry = killByRound[n - 1];
        expect(entry.probability).toBeCloseTo(p * (1 - p) ** (n - 1), 5);
      });
    });
  });

  // ── Monotonicity with target wounds ───────────────────────────────────

  describe('monotonicity with targetWounds', () => {
    it('more target wounds → higher expectedRounds', () => {
      const e1 = useCase.execute({ ...STANDARD_INPUT, targetWounds: 1 }).expectedRounds;
      const e3 = useCase.execute({ ...STANDARD_INPUT, targetWounds: 3 }).expectedRounds;
      const e6 = useCase.execute({ ...STANDARD_INPUT, targetWounds: 6 }).expectedRounds;
      expect(e3).toBeGreaterThan(e1);
      expect(e6).toBeGreaterThan(e3);
    });

    it('more target wounds → lower P(kill by round 1)', () => {
      const cp1 = useCase.execute({ ...STANDARD_INPUT, targetWounds: 1 }).killByRound[0].cumulativeProbability;
      const cp3 = useCase.execute({ ...STANDARD_INPUT, targetWounds: 3 }).killByRound[0].cumulativeProbability;
      expect(cp3).toBeLessThan(cp1);
    });
  });

  // ── damagePerRoundDist ─────────────────────────────────────────────────

  describe('damagePerRoundDist', () => {
    it('matches CalculateUnitCombatUseCase output for the same weapon groups', () => {
      const { damagePerRoundDist } = useCase.execute(STANDARD_INPUT);
      const unitCase = new CalculateUnitCombatUseCase();
      const { totalDamageDist } = unitCase.execute({
        weaponGroups: STANDARD_INPUT.weaponGroups,
        toughness:    STANDARD_INPUT.toughness,
        savePools:    STANDARD_INPUT.savePools,
      });
      // Same distribution (equality up to float rounding)
      expect(damagePerRoundDist.length).toBe(totalDamageDist.length);
      damagePerRoundDist.forEach(({ value, probability }, i) => {
        expect(value).toBe(totalDamageDist[i].value);
        expect(probability).toBeCloseTo(totalDamageDist[i].probability);
      });
    });

    it('P(kill by round 1) equals P(deal ≥ targetWounds in one round)', () => {
      const wounds = 3;
      const { killByRound, damagePerRoundDist } = useCase.execute({
        ...STANDARD_INPUT,
        // 4 attacks to have a non-zero chance of reaching 3W in round 1
        weaponGroups: [{ ...STANDARD_INPUT.weaponGroups[0], attacksDist: fixed(4) }],
        targetWounds: wounds,
      });
      const pKillRound1 = killByRound[0].cumulativeProbability;
      const pDealEnough = 1 - cumulativeProbability(damagePerRoundDist, wounds - 1);
      expect(pKillRound1).toBeCloseTo(pDealEnough);
    });
  });

  // ── Input validation ───────────────────────────────────────────────────

  describe('input validation', () => {
    it('throws RangeError when targetWounds is 0', () => {
      expect(() => useCase.execute({ ...STANDARD_INPUT, targetWounds: 0 })).toThrow(RangeError);
    });

    it('throws RangeError when targetWounds is negative', () => {
      expect(() => useCase.execute({ ...STANDARD_INPUT, targetWounds: -1 })).toThrow(RangeError);
    });

    it('throws RangeError when targetWounds is not an integer', () => {
      expect(() => useCase.execute({ ...STANDARD_INPUT, targetWounds: 1.5 })).toThrow(RangeError);
    });

    it('throws RangeError when maxRounds is 0', () => {
      expect(() => useCase.execute({ ...STANDARD_INPUT, maxRounds: 0 })).toThrow(RangeError);
    });

    it('throws RangeError when maxRounds is negative', () => {
      expect(() => useCase.execute({ ...STANDARD_INPUT, maxRounds: -1 })).toThrow(RangeError);
    });

    it('throws RangeError when maxRounds is not an integer', () => {
      expect(() => useCase.execute({ ...STANDARD_INPUT, maxRounds: 2.5 })).toThrow(RangeError);
    });
  });
});
