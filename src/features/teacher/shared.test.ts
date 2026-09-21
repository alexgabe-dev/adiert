import { describe, expect, it } from 'vitest';
import { applicationSchema, csvCell, uploadDetailsSchema } from './shared';
describe('school portal validation', () => {
  it('requires real school and contact details', () => {
    expect(
      applicationSchema.safeParse({
        school_id: '',
        school_name: 'Iskola',
        city: 'Budapest',
        postal_code: '1051',
        contact_name: 'Teszt Tanár',
      }).success,
    ).toBe(true);
    expect(
      applicationSchema.safeParse({
        school_id: '',
        school_name: 'x',
        city: '',
        postal_code: 'abc',
        contact_name: '',
      }).success,
    ).toBe(false);
  });
  it('rejects future dates and fractional, negative, or excessive counts', () => {
    for (const count of [-1, 0, 2.5, 100001])
      expect(
        uploadDetailsSchema.safeParse({ count, date: '2026-01-01', note: 'Indoklás' }).success,
      ).toBe(false);
    expect(uploadDetailsSchema.safeParse({ count: 50, date: '2099-01-01' }).success).toBe(false);
  });
  it('requires a meaningful reason for fewer than 50 bottles', () => {
    expect(
      uploadDetailsSchema.safeParse({ count: 49, date: '2026-01-01', note: '  ' }).success,
    ).toBe(false);
    expect(
      uploadDetailsSchema.safeParse({ count: 49, date: '2026-01-01', note: 'Megtelt az automata.' })
        .success,
    ).toBe(true);
  });
  it('escapes spreadsheet formula injection and double quotes', () => {
    expect(csvCell('=HYPERLINK("evil")')).toBe('"\'=HYPERLINK(""evil"")"');
    expect(csvCell('Normal; data')).toBe('"Normal; data"');
  });
});
