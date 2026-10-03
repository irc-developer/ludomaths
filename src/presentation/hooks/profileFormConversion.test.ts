import {
  formatProfileReviewDefensiveLine,
  formatProfileReviewWeaponLine,
} from './profileFormConversion';

describe('profileFormConversion review formatters', () => {
  it('formats defensive stats with SA as the save abbreviation', () => {
    expect(formatProfileReviewDefensiveLine('4', '10', '3')).toBe('T4  W10  SA3+');
  });

  it('formats weapon stats with F as the strength abbreviation', () => {
    expect(
      formatProfileReviewWeaponLine({
        attacks: '2',
        hitThreshold: '3',
        strength: '5',
        ap: '1',
        damage: '2',
        modelCount: '5',
      }),
    ).toBe('5× A2 F5 AP-1 D2 (3+)');
  });
});