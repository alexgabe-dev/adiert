// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), client: vi.fn(), headers: new Headers() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: async () => mocks.headers }));
vi.mock('@/lib/supabase/admin', () => ({ createPrivilegedSupabaseClient: mocks.client }));
import { allowTeacherAuth } from './auth-rate-limit';

describe('teacher authentication rate limit', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('SUBMISSION_RATE_LIMIT_SECRET', 'a'.repeat(40));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.headers = new Headers({ 'x-vercel-forwarded-for': '192.0.2.1' });
    mocks.client.mockReturnValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 3600 }],
      error: null,
    });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  it('checks both email and network before allowing a request', async () => {
    expect(await allowTeacherAuth('Teacher@example.test')).toEqual({ allowed: true });
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc.mock.calls[0]![1]).toMatchObject({
      requested_scope: 'teacher_auth_email',
      maximum_requests: 3,
    });
    expect(mocks.rpc.mock.calls[1]![1]).toMatchObject({
      requested_scope: 'teacher_auth_ip',
      maximum_requests: 30,
    });
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain('Teacher@example.test');
  });
  it('reports configuration failures as technical errors, not exhausted quotas', async () => {
    vi.stubEnv('SUBMISSION_RATE_LIMIT_SECRET', 'short');
    const result = await allowTeacherAuth('teacher@example.test');
    expect(result).toMatchObject({
      allowed: false,
      message: expect.stringContaining('technikai hiba'),
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('fails closed on database errors without blaming the teacher', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    expect(await allowTeacherAuth('teacher@example.test')).toMatchObject({
      allowed: false,
      message: expect.stringContaining('technikai hiba'),
    });
  });
  it('fails closed on network failures', async () => {
    mocks.rpc.mockRejectedValue(new Error('network'));
    expect(await allowTeacherAuth('teacher@example.test')).toMatchObject({
      allowed: false,
      message: expect.stringContaining('technikai hiba'),
    });
  });
  it('shows the real remaining wait for an email limit', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: false, retry_after_seconds: 121 }],
      error: null,
    });
    expect(await allowTeacherAuth('teacher@example.test')).toMatchObject({
      allowed: false,
      message: expect.stringContaining('3 perc'),
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it('also enforces the shared network limit', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ allowed: true }], error: null });
    mocks.rpc.mockResolvedValueOnce({
      data: [{ allowed: false, retry_after_seconds: 60 }],
      error: null,
    });
    expect(await allowTeacherAuth('teacher@example.test')).toMatchObject({
      allowed: false,
      message: expect.stringContaining('1 perc'),
    });
  });
  it('rejects malformed database responses as technical errors', async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    expect(await allowTeacherAuth('teacher@example.test')).toMatchObject({
      allowed: false,
      message: expect.stringContaining('technikai hiba'),
    });
  });
});
