import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createServerSupabaseClient } = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient }));

import { getActiveAdministrator } from '@/lib/auth/authorization';

function supabaseWithAdministrator(
  administrator: {
    user_id: string;
    role: string;
    active: boolean;
    display_name: string | null;
  } | null,
) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: administrator, error: null });
  const secondEq = vi.fn().mockReturnValue({ maybeSingle });
  const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
  const select = vi.fn().mockReturnValue({ eq: firstEq });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: '00000000-0000-4000-8000-000000000002',
            email: 'reviewer@example.test',
          },
        },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({ select }),
  };
}

describe('getActiveAdministrator', () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
  });

  it('denies access when Supabase is not configured', async () => {
    createServerSupabaseClient.mockResolvedValue(null);
    await expect(getActiveAdministrator()).resolves.toBeNull();
  });

  it('denies an inactive administrator even with a valid Auth session', async () => {
    createServerSupabaseClient.mockResolvedValue(
      supabaseWithAdministrator({
        user_id: '00000000-0000-4000-8000-000000000002',
        role: 'super_admin',
        active: false,
        display_name: 'Inactive',
      }),
    );

    await expect(getActiveAdministrator()).resolves.toBeNull();
  });

  it('returns the database-authoritative role for an active administrator', async () => {
    createServerSupabaseClient.mockResolvedValue(
      supabaseWithAdministrator({
        user_id: '00000000-0000-4000-8000-000000000002',
        role: 'reviewer',
        active: true,
        display_name: 'Reviewer',
      }),
    );

    await expect(getActiveAdministrator()).resolves.toEqual({
      userId: '00000000-0000-4000-8000-000000000002',
      email: 'reviewer@example.test',
      role: 'reviewer',
      displayName: 'Reviewer',
    });
  });
});
