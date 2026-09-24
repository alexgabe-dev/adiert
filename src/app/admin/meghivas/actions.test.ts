// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  origin: vi.fn(),
  client: vi.fn(),
  verify: vi.fn(),
  signOut: vi.fn(),
  query: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/security/origin', () => ({ hasValidMutationOrigin: mocks.origin }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: mocks.client }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
import { acceptAdministratorInvitation } from './actions';

describe('administrator invitation acceptance', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.origin.mockResolvedValue(true);
    mocks.verify.mockResolvedValue({ data: { user: { id: 'invited-user' } }, error: null });
    mocks.query.mockResolvedValue({ data: { user_id: 'invited-user' }, error: null });
    const query = { select: () => query, eq: vi.fn(() => query), maybeSingle: mocks.query };
    mocks.client.mockResolvedValue({
      auth: { verifyOtp: mocks.verify, signOut: mocks.signOut },
      from: () => query,
    });
  });
  function accept(token = 'a'.repeat(56)) {
    const form = new FormData();
    form.set('token', token);
    return acceptAdministratorInvitation({ status: 'idle', message: '' }, form);
  }
  it('verifies the invitation and enters the admin portal', async () => {
    await expect(accept()).rejects.toThrow('REDIRECT:/admin');
    expect(mocks.verify).toHaveBeenCalledWith({ token_hash: 'a'.repeat(56), type: 'invite' });
  });
  it('rejects an expired or already consumed invitation', async () => {
    mocks.verify.mockResolvedValue({ data: { user: null }, error: { code: 'otp_expired' } });
    expect((await accept()).status).toBe('error');
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('signs out when the administrator access has been revoked', async () => {
    mocks.query.mockResolvedValue({ data: null, error: null });
    expect((await accept()).status).toBe('error');
    expect(mocks.signOut).toHaveBeenCalled();
  });
  it('rejects a cross-origin submission before consuming the token', async () => {
    mocks.origin.mockResolvedValue(false);
    expect((await accept()).status).toBe('error');
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it('rejects malformed tokens before contacting Auth', async () => {
    expect((await accept('bad-token')).status).toBe('error');
    expect(mocks.verify).not.toHaveBeenCalled();
  });
});
