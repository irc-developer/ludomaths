import { UnitProfile, validateUnitProfile } from './unitProfile';

function makeValid(): UnitProfile {
  return {
    name: 'Intercessors',
    wounds: 10,
    toughness: 4,
    weaponGroups: [],
    savePools: [{ baseSave: 3, fraction: 1 }],
  };
}

describe('validateUnitProfile', () => {
  it('does not throw for a valid profile', () => {
    expect(() => validateUnitProfile(makeValid())).not.toThrow();
  });

  it('accepts a profile with empty weaponGroups (defender-only unit)', () => {
    expect(() => validateUnitProfile({ ...makeValid(), weaponGroups: [] })).not.toThrow();
  });

  describe('name', () => {
    it('throws RangeError when name is empty', () => {
      expect(() => validateUnitProfile({ ...makeValid(), name: '' })).toThrow(RangeError);
    });

    it('throws RangeError when name is only whitespace', () => {
      expect(() => validateUnitProfile({ ...makeValid(), name: '   ' })).toThrow(RangeError);
    });
  });

  describe('wounds', () => {
    it('throws RangeError when wounds is 0', () => {
      expect(() => validateUnitProfile({ ...makeValid(), wounds: 0 })).toThrow(RangeError);
    });

    it('throws RangeError when wounds is negative', () => {
      expect(() => validateUnitProfile({ ...makeValid(), wounds: -1 })).toThrow(RangeError);
    });

    it('throws RangeError when wounds is not an integer', () => {
      expect(() => validateUnitProfile({ ...makeValid(), wounds: 1.5 })).toThrow(RangeError);
    });
  });

  describe('toughness', () => {
    it('throws RangeError when toughness is 0', () => {
      expect(() => validateUnitProfile({ ...makeValid(), toughness: 0 })).toThrow(RangeError);
    });

    it('throws RangeError when toughness is not an integer', () => {
      expect(() => validateUnitProfile({ ...makeValid(), toughness: 3.5 })).toThrow(RangeError);
    });
  });

  describe('savePools', () => {
    it('throws RangeError when savePools is empty', () => {
      expect(() => validateUnitProfile({ ...makeValid(), savePools: [] })).toThrow(RangeError);
    });

    it('throws RangeError when fractions do not sum to 1', () => {
      expect(() =>
        validateUnitProfile({
          ...makeValid(),
          savePools: [
            { baseSave: 3, fraction: 0.4 },
            { baseSave: 5, fraction: 0.4 },
          ],
        }),
      ).toThrow(RangeError);
    });

    it('accepts multiple pools whose fractions sum exactly to 1', () => {
      expect(() =>
        validateUnitProfile({
          ...makeValid(),
          savePools: [
            { baseSave: 3, fraction: 0.5 },
            { baseSave: 5, fraction: 0.5 },
          ],
        }),
      ).not.toThrow();
    });
  });
});
