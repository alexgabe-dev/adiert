import { describe, expect, it } from 'vitest';

import { administratorHasRole } from '@/lib/auth/roles';

describe('administratorHasRole', () => {
  it('keeps reviewer access below admin operations', () => {
    expect(administratorHasRole('reviewer', 'reviewer')).toBe(true);
    expect(administratorHasRole('reviewer', 'admin')).toBe(false);
    expect(administratorHasRole('reviewer', 'super_admin')).toBe(false);
  });

  it('allows admins to review but not manage administrators', () => {
    expect(administratorHasRole('admin', 'reviewer')).toBe(true);
    expect(administratorHasRole('admin', 'admin')).toBe(true);
    expect(administratorHasRole('admin', 'super_admin')).toBe(false);
  });

  it('allows super administrators through every role gate', () => {
    expect(administratorHasRole('super_admin', 'reviewer')).toBe(true);
    expect(administratorHasRole('super_admin', 'admin')).toBe(true);
    expect(administratorHasRole('super_admin', 'super_admin')).toBe(true);
  });
});
