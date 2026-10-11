import { describe, expect, it } from 'vitest';
import { attackContextId, missingAttackContext } from './attackContext';
import { validateAttack } from './wizardValidation';
import { WH40K_PRESETS, type CombatParams } from './presets';

const profile: CombatParams = { ...WH40K_PRESETS[0].params, attackType: 'ranged' };
const heavy: CombatParams = { ...profile, heavy: true };
const answered: CombatParams = { ...heavy, phase: 'shooting', engaged: false, setUpThisTurn: false, movedOverThree: false };

describe('actionable attack context', () => {
  it('identifies separate unanswered weapons and groups with distinct field targets', () => {
    const params = { ...profile, modelCount: 2, primaryExtraWeapons: [heavy],
      attackerEquipmentGroups: [{ id: 'group 2', count: 1, weapons: [{ ...profile, melta: 2 }] }] };
    const { issues } = validateAttack(null, params, 'combat', 90);
    expect(issues).toHaveLength(5);
    expect(issues[0]).toEqual({ target: `${attackContextId('primary', 1)}-phase`,
      message: 'Grupo atacante 1 · Arma y modo 2: Arma manual (Heavy): elige la fase en la que se realiza el ataque.' });
    expect(issues[4]).toEqual({ target: `${attackContextId('group 2', 0)}-withinHalfRange`,
      message: 'Grupo atacante 2 · Arma y modo 1: Arma manual (Melta): indica si el objetivo está dentro o fuera de la mitad del alcance.' });
    expect(new Set(issues.map(issue => issue.target)).size).toBe(5);
    expect(missingAttackContext({ ...params, primaryExtraWeapons: [answered] }, null).map(field => field.target))
      .toEqual([`${attackContextId('group 2', 0)}-withinHalfRange`]);
  });

  it('deduplicates shared answers while preserving every rule that needs half-range', () => {
    const params = { ...profile, modelCount: 2, squadEquipment: { reviewId: 'shared', initialModelCount: 2, rows: [] }, primaryExtraWeapons: [heavy],
      attackerEquipmentGroups: [{ id: 'extra', count: 1, weapons: [{ ...profile, rapidFire: 1, melta: 2 }] }] };
    const fields = missingAttackContext(params, null);
    expect(fields).toHaveLength(5);
    expect(fields[0].message).toContain('Rapid Fire / Melta');
    expect(fields.every(field => field.target.startsWith(attackContextId()))).toBe(true);
  });

  it('accepts explicit negative answers and ignores ranged conditions for melee weapons', () => {
    expect(validateAttack(null, { ...answered, rapidFire: 1, melta: 2, withinHalfRange: false }, 'combat', 90).issues).toEqual([]);
    expect(validateAttack(null, { ...heavy, rapidFire: 1, melta: 2, attackType: 'melee' }, 'combat', 90).issues).toEqual([]);
    expect(missingAttackContext({ ...profile, heavy: false, rapidFire: 0, melta: 0 }, null)).toEqual([]);
  });
});
