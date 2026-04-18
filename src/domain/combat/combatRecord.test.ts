import { CombatRecord, validateCombatRecord } from './combatRecord';
import { UnitProfile } from '@domain/profiles/unitProfile';

function makeAttacker(overrides: Partial<UnitProfile> = {}): UnitProfile {
  return {
    name: 'Intercessors',
    wounds: 10,
    toughness: 4,
    weaponGroups: [{
      attacksDist:  [{ value: 2, probability: 1 }],
      hitThreshold: 3,
      strengthDist: [{ value: 4, probability: 1 }],
      ap:           0,
      damageDist:   [{ value: 1, probability: 1 }],
      modelCount:   5,
    }],
    savePools: [{ baseSave: 3, fraction: 1 }],
    ...overrides,
  };
}

function makeDefender(overrides: Partial<UnitProfile> = {}): UnitProfile {
  return {
    name: 'Guardia Imperial',
    wounds: 10,
    toughness: 3,
    weaponGroups: [],
    savePools: [{ baseSave: 5, fraction: 1 }],
    ...overrides,
  };
}

function makeRecord(overrides: Partial<CombatRecord> = {}): CombatRecord {
  return {
    label:    'Intercessors vs Guardia',
    attacker: makeAttacker(),
    defender: makeDefender(),
    ...overrides,
  };
}

describe('validateCombatRecord', () => {
  it('does not throw for a valid record', () => {
    expect(() => validateCombatRecord(makeRecord())).not.toThrow();
  });

  describe('label', () => {
    it('throws RangeError when label is empty', () => {
      expect(() => validateCombatRecord(makeRecord({ label: '' }))).toThrow(RangeError);
    });

    it('throws RangeError when label is only whitespace', () => {
      expect(() => validateCombatRecord(makeRecord({ label: '   ' }))).toThrow(RangeError);
    });
  });

  describe('attacker', () => {
    it('throws RangeError when attacker name is empty', () => {
      expect(() =>
        validateCombatRecord(makeRecord({ attacker: makeAttacker({ name: '' }) })),
      ).toThrow(RangeError);
    });

    it('throws RangeError when attacker has no weapon groups', () => {
      expect(() =>
        validateCombatRecord(makeRecord({ attacker: makeAttacker({ weaponGroups: [] }) })),
      ).toThrow(RangeError);
    });

    it('throws RangeError when attacker wounds is 0', () => {
      expect(() =>
        validateCombatRecord(makeRecord({ attacker: makeAttacker({ wounds: 0 }) })),
      ).toThrow(RangeError);
    });
  });

  describe('defender', () => {
    it('throws RangeError when defender name is empty', () => {
      expect(() =>
        validateCombatRecord(makeRecord({ defender: makeDefender({ name: '' }) })),
      ).toThrow(RangeError);
    });

    it('does not throw when defender has no weapon groups', () => {
      // Defender is a combat target; no weapons is valid.
      expect(() =>
        validateCombatRecord(makeRecord({ defender: makeDefender({ weaponGroups: [] }) })),
      ).not.toThrow();
    });

    it('throws RangeError when defender toughness is 0', () => {
      expect(() =>
        validateCombatRecord(makeRecord({ defender: makeDefender({ toughness: 0 }) })),
      ).toThrow(RangeError);
    });
  });
});
