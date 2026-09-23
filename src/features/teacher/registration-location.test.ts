import { describe, expect, it } from 'vitest';
import { matchesPostalCity, normalizeCity, postalCities } from './registration-location';

describe('postal lookup', () => {
  it('uses official postal towns including city street-directory codes', () => {
    expect(postalCities('4400')).toContain('Nyíregyháza');
    expect(postalCities('1111')).toContain('Budapest');
    expect(postalCities('0000')).toEqual([]);
  });
  it('matches source spelling variants without admitting another town', () => {
    expect(matchesPostalCity('4400', 'Nyiregyháza')).toBe(true);
    expect(matchesPostalCity('4400', 'Budapest')).toBe(false);
    expect(normalizeCity('Budapest XIV. kerület')).toBe('budapest');
  });
});
