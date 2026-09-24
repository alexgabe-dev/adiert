// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({ after: vi.fn() }));
const d = vi.hoisted(() => ({ rpc: vi.fn(), update: vi.fn(), eq: vi.fn(), upsert: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({
  createPrivilegedSupabaseClient: () => ({
    rpc: d.rpc,
    from: () => ({ update: d.update, upsert: d.upsert }),
  }),
}));
vi.mock('@/lib/env', () => ({ environment: { SITE_URL: 'https://adiert.example' } }));
import { dispatchNotifications } from './notifications';
const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  vi.stubEnv('NOTIFICATION_FROM', 'test@example.test');
  d.rpc.mockResolvedValue({
    data: [
      {
        id: 'mail-1',
        recipient: 'teacher@example.test',
        subject: 'Elfogadva',
        body: 'Iskolád regisztrációja sikeres.',
        link_path: '/tanar',
      },
    ],
    error: null,
  });
  d.update.mockReturnValue({ eq: d.eq });
  d.eq.mockResolvedValue({ error: null });
  d.upsert.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('durable notification delivery', () => {
  it('leaves messages queued if sender configuration is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    expect(await dispatchNotifications()).toEqual({ sent: 0, configured: false });
    expect(d.rpc).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('uses a stable provider idempotency key and only marks accepted messages sent', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    expect((await dispatchNotifications()).sent).toBe(1);
    expect(fetchMock.mock.calls[0]?.[1].headers['Idempotency-Key']).toBe('adiert-mail-1');
    expect(d.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent', last_error: null }),
    );
  });
  it('records provider failures without losing the application decision', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    expect((await dispatchNotifications()).sent).toBe(0);
    expect(d.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', last_error: expect.stringContaining('503') }),
    );
  });
  it('creates a stable private activation token and a confirmation link', async () => {
    vi.stubEnv('SUBMISSION_RATE_LIMIT_SECRET', 'test-secret-'.repeat(4));
    d.rpc.mockResolvedValue({
      data: [
        {
          id: 'activation-1',
          recipient: 'teacher@example.test',
          subject: 'Elfogadva',
          body: 'Köszönjük',
          link_path: '/tanar',
          kind: 'activation',
          target_user_id: 'user-1',
        },
      ],
      error: null,
    });
    fetchMock.mockResolvedValue({ ok: true });
    await dispatchNotifications();
    const first = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(first.html).toContain('/tanar/megerosites?token=');
    expect(first.html).toContain('Regisztráció megerősítése');
    expect(d.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      { onConflict: 'mail_id', ignoreDuplicates: true },
    );
    await dispatchNotifications();
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body)).toEqual(first);
  });
});
