// @vitest-environment node
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn() }));
import { teacherEntryStatus } from './server';

const user = { id: 'teacher', email: 'teacher@example.com' } as User;
function clientFor(tables: Record<string, unknown>, failed = false) {
  return {
    from: (table: string) => {
      const response = {
        data: tables[table] ?? null,
        error: failed ? { message: 'offline' } : null,
      };
      const query = {
        select: () => query,
        eq: () => query,
        gt: () => query,
        maybeSingle: async () => response,
        limit: async () => response,
      };
      return query;
    },
  } as unknown as SupabaseClient;
}

describe('teacher entry approval', () => {
  it('reports a pending applicant as pending, not approved', async () => {
    expect(
      await teacherEntryStatus(clientFor({ school_applications: { status: 'pending' } }), user),
    ).toBe('pending');
  });
  it('requires active membership and an active school', async () => {
    const membership = { school_id: 'school', active: true };
    expect(
      await teacherEntryStatus(
        clientFor({ school_memberships: membership, schools: { active: true } }),
        user,
      ),
    ).toBe('approved');
    expect(
      await teacherEntryStatus(
        clientFor({ school_memberships: membership, schools: { active: false } }),
        user,
      ),
    ).toBe('paused');
    expect(
      await teacherEntryStatus(clientFor({ school_applications: { status: 'approved' } }), user),
    ).toBe('paused');
  });
  it('preserves the school-admin invitation and requested correction flows', async () => {
    expect(
      await teacherEntryStatus(clientFor({ school_invitations: [{ id: 'invite' }] }), user),
    ).toBe('invited');
    expect(
      await teacherEntryStatus(
        clientFor({ school_applications: { status: 'needs_changes' } }),
        user,
      ),
    ).toBe('needs_changes');
  });
  it('does not interpret database failure as permission', async () => {
    await expect(teacherEntryStatus(clientFor({}, true), user)).rejects.toThrow();
  });
});
