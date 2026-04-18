import { Distribution, expectedValue } from '@domain/math/distribution';
import { CalculateUnitCombatUseCase, SavePool, WeaponGroup } from './CalculateUnitCombatUseCase';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Degenerate distribution fixed at a single value. */
function fixed(value: number): Distribution {
  return [{ value, probability: 1 }];
}

/** Sum of all probabilities in a distribution. */
function sumProbabilities(dist: Distribution): number {
  return dist.reduce((acc, { probability }) => acc + probability, 0);
}

// ── Common fixtures ────────────────────────────────────────────────────────

/**
 * Baseline weapon group: 1 model, 1 fixed attack, hits on 3+, S4, AP0, 1 damage.
 * Against T4, save 4+.
 *   P(hit)      = 4/6
 *   P(wound)    = 3/6  (S4 vs T4 → 4+)
 *   P(failSave) = 3/6  (save 4+, AP0 → effective 4+)
 *   E[damage]   = 1 × (4/6) × (3/6) × (3/6) ≈ 0.1667
 */
const BASELINE_WEAPON_GROUP: WeaponGroup = {
  attacksDist: fixed(1),
  hitThreshold: 3,
  strengthDist: fixed(4),
  ap: 0,
  damageDist: fixed(1),
  modelCount: 1,
};

const BASELINE_SAVE_POOL: SavePool[] = [{ baseSave: 4, fraction: 1 }];

const useCase = new CalculateUnitCombatUseCase();

// ── Core contract ──────────────────────────────────────────────────────────

describe('CalculateUnitCombatUseCase', () => {
  describe('probability distribution contract', () => {
    it('probabilities sum to 1 (single group, single pool)', () => {
      const { totalDamageDist } = useCase.execute({
        weaponGroups: [BASELINE_WEAPON_GROUP],
        toughness: 4,
        savePools: BASELINE_SAVE_POOL,
      });
      expect(sumProbabilities(totalDamageDist)).toBeCloseTo(1);
    });

    it('probabilities sum to 1 (two groups, two pools)', () => {
      const { totalDamageDist } = useCase.execute({
        weaponGroups: [BASELINE_WEAPON_GROUP, BASELINE_WEAPON_GROUP],
        toughness: 4,
        savePools: [
          { baseSave: 3, fraction: 0.5 },
          { baseSave: 5, fraction: 0.5 },
        ],
      });
      expect(sumProbabilities(totalDamageDist)).toBeCloseTo(1);
    });
  });

  // ── Model count ────────────────────────────────────────────────────────

  describe('modelCount', () => {
    it('modelCount=0 returns degenerate distribution at 0', () => {
      const { totalDamageDist } = useCase.execute({
        weaponGroups: [{ ...BASELINE_WEAPON_GROUP, modelCount: 0 }],
        toughness: 4,
        savePools: BASELINE_SAVE_POOL,
      });
      expect(totalDamageDist).toEqual([{ value: 0, probability: 1 }]);
    });

    it('n models with same weapon equals n groups of 1 model each', () => {
      // One group with 2 models
      const { totalDamageDist: twoModels } = useCase.execute({
        weaponGroups: [{ ...BASELINE_WEAPON_GROUP, modelCount: 2 }],
        toughness: 4,
        savePools: BASELINE_SAVE_POOL,
      });

      // Two groups of 1 model with the same weapon
      const { totalDamageDist: twoGroups } = useCase.execute({
        weaponGroups: [BASELINE_WEAPON_GROUP, BASELINE_WEAPON_GROUP],
        toughness: 4,
        savePools: BASELINE_SAVE_POOL,
      });

      // Both produce the same distribution (binomial thinning is distributive
      // over convolution: applyStage(conv(A, B), p) = conv(applyStage(A, p), applyStage(B, p)))
      expect(expectedValue(twoModels)).toBeCloseTo(expectedValue(twoGroups));
      expect(twoModels.length).toBe(twoGroups.length);
      twoModels.forEach(({ value, probability }, i) => {
        expect(value).toBe(twoGroups[i].value);
        expect(probability).toBeCloseTo(twoGroups[i].probability);
      });
    });

    it('expected damage scales linearly with model count when all else is fixed', () => {
      const e1 = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, modelCount: 1 }],
          toughness: 4,
          savePools: BASELINE_SAVE_POOL,
        }).totalDamageDist,
      );
      const e3 = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, modelCount: 3 }],
          toughness: 4,
          savePools: BASELINE_SAVE_POOL,
        }).totalDamageDist,
      );
      expect(e3).toBeCloseTo(3 * e1);
    });
  });

  // ── Multiple weapon groups ─────────────────────────────────────────────

  describe('multiple weapon groups', () => {
    it('two distinct weapon groups produce higher expected damage than either alone', () => {
      const heavyWeapon: WeaponGroup = {
        attacksDist: fixed(2),
        hitThreshold: 3,
        strengthDist: fixed(8),
        ap: 2,
        damageDist: fixed(3),
        modelCount: 1,
      };

      const eBase = expectedValue(
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP],
          toughness: 4,
          savePools: BASELINE_SAVE_POOL,
        }).totalDamageDist,
      );
      const eHeavy = expectedValue(
        useCase.execute({
          weaponGroups: [heavyWeapon],
          toughness: 4,
          savePools: BASELINE_SAVE_POOL,
        }).totalDamageDist,
      );
      const eBoth = expectedValue(
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP, heavyWeapon],
          toughness: 4,
          savePools: BASELINE_SAVE_POOL,
        }).totalDamageDist,
      );

      expect(eBoth).toBeCloseTo(eBase + eHeavy);
    });
  });

  // ── Multiple save pools ────────────────────────────────────────────────

  describe('multiple save pools', () => {
    it('better save pool reduces expected damage', () => {
      const eGoodSave = expectedValue(
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP],
          toughness: 4,
          savePools: [{ baseSave: 2, fraction: 1 }],
        }).totalDamageDist,
      );
      const eBadSave = expectedValue(
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP],
          toughness: 4,
          savePools: [{ baseSave: 6, fraction: 1 }],
        }).totalDamageDist,
      );
      expect(eGoodSave).toBeLessThan(eBadSave);
    });

    it('mixed save pools produce expected damage between the two extremes', () => {
      const eGoodOnly = expectedValue(
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP],
          toughness: 4,
          savePools: [{ baseSave: 2, fraction: 1 }],
        }).totalDamageDist,
      );
      const eBadOnly = expectedValue(
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP],
          toughness: 4,
          savePools: [{ baseSave: 6, fraction: 1 }],
        }).totalDamageDist,
      );
      const eMixed = expectedValue(
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP],
          toughness: 4,
          savePools: [
            { baseSave: 2, fraction: 0.5 },
            { baseSave: 6, fraction: 0.5 },
          ],
        }).totalDamageDist,
      );

      expect(eMixed).toBeGreaterThan(eGoodOnly);
      expect(eMixed).toBeLessThan(eBadOnly);
    });

    it('AP that negates armor save is accounted for per pool', () => {
      // AP=1: baseSave=6 → effectiveSave=7 (impossible, failSave=1)
      //       baseSave=2 → effectiveSave=3 (failSave=2/6 — save still active)
      // The pool whose save is negated must produce more damage.
      const eNegated = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 1 }],
          toughness: 4,
          savePools: [{ baseSave: 6, fraction: 1 }],
        }).totalDamageDist,
      );
      const eSaved = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 1 }],
          toughness: 4,
          savePools: [{ baseSave: 2, fraction: 1 }],
        }).totalDamageDist,
      );
      expect(eNegated).toBeGreaterThan(eSaved);
    });
  });

  // ── Input validation ───────────────────────────────────────────────────

  describe('input validation', () => {
    it('throws RangeError when savePools is empty', () => {
      expect(() =>
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP],
          toughness: 4,
          savePools: [],
        }),
      ).toThrow(RangeError);
    });

    it('throws RangeError when save pool fractions do not sum to 1', () => {
      expect(() =>
        useCase.execute({
          weaponGroups: [BASELINE_WEAPON_GROUP],
          toughness: 4,
          savePools: [
            { baseSave: 3, fraction: 0.3 },
            { baseSave: 5, fraction: 0.3 },
          ],
        }),
      ).toThrow(RangeError);
    });

    it('throws RangeError when weaponGroups is empty', () => {
      expect(() =>
        useCase.execute({
          weaponGroups: [],
          toughness: 4,
          savePools: BASELINE_SAVE_POOL,
        }),
      ).toThrow(RangeError);
    });

    it('throws RangeError when modelCount is negative', () => {
      expect(() =>
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, modelCount: -1 }],
          toughness: 4,
          savePools: BASELINE_SAVE_POOL,
        }),
      ).toThrow(RangeError);
    });

    it('throws RangeError when modelCount is not an integer', () => {
      expect(() =>
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, modelCount: 1.5 }],
          toughness: 4,
          savePools: BASELINE_SAVE_POOL,
        }),
      ).toThrow(RangeError);
    });
  });

  // ── Invulnerable save per pool ─────────────────────────────────────────

  describe('invulnerableSave per pool', () => {
    it('reduces expected damage when invulnerable protects a negated pool', () => {
      // AP-5 negates a 6+ save (effective 11+); invulnerable 4+ limits the damage
      const withInvuln = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 5 }],
          toughness: 4,
          savePools: [{ baseSave: 6, fraction: 1, invulnerableSave: 4 }],
        }).totalDamageDist,
      );
      const withoutInvuln = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 5 }],
          toughness: 4,
          savePools: [{ baseSave: 6, fraction: 1 }],
        }).totalDamageDist,
      );
      expect(withInvuln).toBeLessThan(withoutInvuln);
    });

    it('has no effect when armor is already better than invulnerable', () => {
      const withInvuln = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 0 }],
          toughness: 4,
          savePools: [{ baseSave: 2, fraction: 1, invulnerableSave: 5 }],
        }).totalDamageDist,
      );
      const withoutInvuln = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 0 }],
          toughness: 4,
          savePools: [{ baseSave: 2, fraction: 1 }],
        }).totalDamageDist,
      );
      expect(withInvuln).toBeCloseTo(withoutInvuln);
    });

    it('pools with and without invulnerable coexist correctly', () => {
      // Half the unit has invulnerable 4+, half has only a weak 6+ armor.
      // Expected damage must be between the two extremes.
      const eMixed = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 5 }],
          toughness: 4,
          savePools: [
            { baseSave: 6, fraction: 0.5, invulnerableSave: 4 },
            { baseSave: 6, fraction: 0.5 },
          ],
        }).totalDamageDist,
      );
      const eFullInvuln = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 5 }],
          toughness: 4,
          savePools: [{ baseSave: 6, fraction: 1, invulnerableSave: 4 }],
        }).totalDamageDist,
      );
      const eNoInvuln = expectedValue(
        useCase.execute({
          weaponGroups: [{ ...BASELINE_WEAPON_GROUP, ap: 5 }],
          toughness: 4,
          savePools: [{ baseSave: 6, fraction: 1 }],
        }).totalDamageDist,
      );
      expect(eMixed).toBeGreaterThan(eFullInvuln);
      expect(eMixed).toBeLessThan(eNoInvuln);
    });
  });
});
