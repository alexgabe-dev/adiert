// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({
  requestHeaders: new Headers(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  requireAdministratorRole: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  createPrivilegedSupabaseClient: vi.fn(),
  rpc: vi.fn(),
  listUsers: vi.fn(),
  inviteUserByEmail: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: async () => dependencies.requestHeaders }));
vi.mock('next/navigation', () => ({ redirect: dependencies.redirect }));
vi.mock('next/cache', () => ({
  revalidatePath: dependencies.revalidatePath,
  revalidateTag: dependencies.revalidateTag,
}));
vi.mock('@/lib/auth/authorization', () => ({
  requireAdministratorRole: dependencies.requireAdministratorRole,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: dependencies.createServerSupabaseClient,
}));
vi.mock('@/lib/supabase/admin', () => ({
  createPrivilegedSupabaseClient: dependencies.createPrivilegedSupabaseClient,
}));

import {
  inviteAdministratorAction,
  manageAdministratorAction,
  saveCampaignAction,
  setSchoolActiveAction,
} from '@/features/admin/control-actions';

const campaignId = '11111111-1111-4111-8111-111111111111';
const schoolId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';

function campaignForm() {
  const data = new FormData();
  data.set('campaign_id', campaignId);
  data.set('name', 'Tesztkampány');
  data.set('slug', 'tesztkampany');
  data.set('description', 'Leírás');
  data.set('target_amount', '100000');
  data.set('start_date', '2026-09-01');
  data.set('end_date', '2026-12-31');
  return data;
}

describe('admin control actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.requestHeaders = new Headers({
      origin: 'https://adiert.example',
      host: 'adiert.example',
    });
    dependencies.requireAdministratorRole.mockResolvedValue({ role: 'super_admin' });
    dependencies.rpc.mockResolvedValue({ data: campaignId, error: null });
    dependencies.createServerSupabaseClient.mockResolvedValue({ rpc: dependencies.rpc });
    dependencies.createPrivilegedSupabaseClient.mockReturnValue(null);
    dependencies.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    dependencies.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: userId, email: 'new@example.test' } },
      error: null,
    });
    dependencies.deleteUser.mockResolvedValue({ data: {}, error: null });
  });

  it('rejects cross-origin campaign mutations before authorization and database access', async () => {
    dependencies.requestHeaders.set('origin', 'https://attacker.example');

    await expect(saveCampaignAction(campaignForm())).rejects.toThrow('REDIRECT:');
    expect(dependencies.requireAdministratorRole).not.toHaveBeenCalled();
    expect(dependencies.rpc).not.toHaveBeenCalled();
  });

  it('authorizes campaign writes as admin and uses the transactional RPC', async () => {
    await expect(saveCampaignAction(campaignForm())).rejects.toThrow(
      `REDIRECT:/admin/kampanyok/${campaignId}`,
    );

    expect(dependencies.requireAdministratorRole).toHaveBeenCalledWith('admin');
    expect(dependencies.rpc).toHaveBeenCalledWith('admin_save_campaign', {
      requested_campaign_id: campaignId,
      requested_name: 'Tesztkampány',
      requested_slug: 'tesztkampany',
      requested_description: 'Leírás',
      requested_target_amount: 100000,
      requested_start_date: '2026-09-01',
      requested_end_date: '2026-12-31',
    });
  });

  it('rejects invalid campaign dates without calling the RPC', async () => {
    const data = campaignForm();
    data.set('start_date', '2026-12-31');
    data.set('end_date', '2026-09-01');

    await expect(saveCampaignAction(data)).rejects.toThrow('REDIRECT:');
    expect(dependencies.requireAdministratorRole).toHaveBeenCalledWith('admin');
    expect(dependencies.rpc).not.toHaveBeenCalled();
  });

  it('uses a separate explicit RPC for school deactivation', async () => {
    dependencies.rpc.mockResolvedValue({ data: null, error: null });
    const data = new FormData();
    data.set('school_id', schoolId);
    data.set('active', 'false');

    await expect(setSchoolActiveAction(data)).rejects.toThrow(
      `REDIRECT:/admin/iskolak/${schoolId}`,
    );
    expect(dependencies.requireAdministratorRole).toHaveBeenCalledWith('admin');
    expect(dependencies.rpc).toHaveBeenCalledWith('admin_set_school_active', {
      requested_school_id: schoolId,
      requested_active: false,
    });
  });

  it('requires super-admin authorization for administrator lifecycle changes', async () => {
    dependencies.rpc.mockResolvedValue({ data: null, error: null });
    const data = new FormData();
    data.set('user_id', userId);
    data.set('role', 'super_admin');
    data.set('active', 'true');

    await expect(manageAdministratorAction(data)).rejects.toThrow(
      'REDIRECT:/admin/adminisztratorok',
    );
    expect(dependencies.requireAdministratorRole).toHaveBeenCalledWith('super_admin');
    expect(dependencies.rpc).toHaveBeenCalledWith('admin_manage_administrator', {
      requested_user_id: userId,
      requested_role: 'super_admin',
      requested_active: true,
    });
  });

  it('handles a duplicate invite by updating the existing Auth user without sending another invite', async () => {
    dependencies.createPrivilegedSupabaseClient.mockReturnValue({
      auth: {
        admin: {
          listUsers: dependencies.listUsers,
          inviteUserByEmail: dependencies.inviteUserByEmail,
          deleteUser: dependencies.deleteUser,
        },
      },
    });
    dependencies.listUsers.mockResolvedValue({
      data: { users: [{ id: userId, email: 'existing@example.test' }] },
      error: null,
    });
    dependencies.rpc.mockResolvedValue({ data: null, error: null });
    const data = new FormData();
    data.set('email', 'existing@example.test');
    data.set('role', 'admin');

    await expect(inviteAdministratorAction(data)).rejects.toThrow(
      'REDIRECT:/admin/adminisztratorok',
    );
    expect(dependencies.requireAdministratorRole).toHaveBeenCalledWith('super_admin');
    expect(dependencies.inviteUserByEmail).not.toHaveBeenCalled();
    expect(dependencies.rpc).toHaveBeenCalledWith('admin_manage_administrator', {
      requested_user_id: userId,
      requested_role: 'admin',
      requested_active: true,
    });
  });

  it('invites a new Auth user and assigns the validated role', async () => {
    dependencies.createPrivilegedSupabaseClient.mockReturnValue({
      auth: {
        admin: {
          listUsers: dependencies.listUsers,
          inviteUserByEmail: dependencies.inviteUserByEmail,
          deleteUser: dependencies.deleteUser,
        },
      },
    });
    dependencies.rpc.mockResolvedValue({ data: null, error: null });
    const data = new FormData();
    data.set('email', 'new@example.test');
    data.set('role', 'reviewer');

    await expect(inviteAdministratorAction(data)).rejects.toThrow(
      'REDIRECT:/admin/adminisztratorok',
    );
    expect(dependencies.inviteUserByEmail).toHaveBeenCalledWith('new@example.test', {
      redirectTo: expect.stringMatching(/\/auth\/callback$/),
    });
    expect(dependencies.rpc).toHaveBeenCalledWith('admin_manage_administrator', {
      requested_user_id: userId,
      requested_role: 'reviewer',
      requested_active: true,
    });
  });

  it('rejects an invalid administrator role before Auth invitation or RPC mutation', async () => {
    const data = new FormData();
    data.set('email', 'new@example.test');
    data.set('role', 'owner');

    await expect(inviteAdministratorAction(data)).rejects.toThrow(
      'REDIRECT:/admin/adminisztratorok',
    );
    expect(dependencies.inviteUserByEmail).not.toHaveBeenCalled();
    expect(dependencies.rpc).not.toHaveBeenCalled();
  });

  it('removes a newly invited Auth user if the transactional role operation fails', async () => {
    dependencies.createPrivilegedSupabaseClient.mockReturnValue({
      auth: {
        admin: {
          listUsers: dependencies.listUsers,
          inviteUserByEmail: dependencies.inviteUserByEmail,
          deleteUser: dependencies.deleteUser,
        },
      },
    });
    dependencies.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    const data = new FormData();
    data.set('email', 'new@example.test');
    data.set('role', 'reviewer');

    await expect(inviteAdministratorAction(data)).rejects.toThrow(
      'REDIRECT:/admin/adminisztratorok',
    );
    expect(dependencies.inviteUserByEmail).toHaveBeenCalled();
    expect(dependencies.deleteUser).toHaveBeenCalledWith(userId);
  });
});
