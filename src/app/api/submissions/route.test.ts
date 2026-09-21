// @vitest-environment node
import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const d = vi.hoisted(() => ({
  session: vi.fn(),
  save: vi.fn(),
  rate: vi.fn(),
  options: vi.fn(),
  client: {},
}));
vi.mock('@/features/teacher/server', () => ({ teacherSession: d.session }));
vi.mock('@/features/teacher/upload', async (original) => ({
  ...(await original<typeof import('@/features/teacher/upload')>()),
  saveTeacherUpload: d.save,
}));
vi.mock('@/features/submissions/rate-limit', async (original) => ({
  ...(await original<typeof import('@/features/submissions/rate-limit')>()),
  enforceSubmissionRateLimits: d.rate,
}));
vi.mock('@/features/submissions/repository', async (original) => ({
  ...(await original<typeof import('@/features/submissions/repository')>()),
  getPublicSubmissionOptions: d.options,
}));
vi.mock('@/lib/supabase/admin', () => ({ createPrivilegedSupabaseClient: () => d.client }));
vi.mock('@/lib/env', () => ({
  environment: { SITE_URL: 'http://localhost:3000' },
  getSubmissionSecurityEnvironment: () => ({
    SUBMISSION_RATE_LIMIT_SECRET: 'a-secret-with-at-least-thirty-two-characters',
  }),
}));
import { POST } from './route';
import { TeacherUploadError } from '@/features/teacher/upload';
const userId = '11111111-1111-4111-8111-111111111111';
const schoolId = '22222222-2222-4222-8222-222222222222';
const campaignId = '33333333-3333-4333-8333-333333333333';
const key = '44444444-4444-4444-8444-444444444444';
let jpeg: Buffer;
function form() {
  const f = new FormData();
  f.set('receipt', new Blob([jpeg], { type: 'image/jpeg' }), 'private.jpg');
  f.set('count', '100');
  f.set('date', '2026-01-01');
  f.set('note', '');
  return f;
}
function request(f = form(), headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/submissions', {
    method: 'POST',
    body: f,
    headers: { origin: 'http://localhost:3000', 'idempotency-key': key, ...headers },
  });
}
describe('authenticated school uploads', () => {
  beforeAll(async () => {
    jpeg = await sharp({ create: { width: 500, height: 700, channels: 3, background: '#fff' } })
      .jpeg()
      .toBuffer();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    d.session.mockResolvedValue({ user: { id: userId }, membership: { school_id: schoolId } });
    d.options.mockResolvedValue({ campaign: { id: campaignId } });
    d.rate.mockResolvedValue(undefined);
    d.save.mockResolvedValue({ publicReference: key, duplicate: false });
  });
  it('rejects cross-origin before authentication', async () => {
    expect((await POST(request(form(), { origin: 'https://evil.example' }))).status).toBe(403);
    expect(d.session).not.toHaveBeenCalled();
  });
  it('requires a signed-in account', async () => {
    d.session.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(d.save).not.toHaveBeenCalled();
  });
  it('requires approved membership', async () => {
    d.session.mockResolvedValue({ user: { id: userId }, membership: null });
    expect((await POST(request())).status).toBe(403);
  });
  it('derives school, actor and campaign on the server', async () => {
    const res = await POST(request());
    expect(res.status).toBe(201);
    expect(d.save).toHaveBeenCalledWith(
      d.client,
      expect.objectContaining({ schoolId, userId, campaignId, count: 100, date: '2026-01-01' }),
    );
    expect(d.save.mock.calls[0]?.[1]).not.toHaveProperty('approvedAmount');
  });
  it.each(['school_id', 'campaign_id', 'approved_amount', 'status', 'submitted_by'])(
    'rejects spoofed field %s',
    async (field) => {
      const f = form();
      f.set(field, 'attacker');
      expect((await POST(request(f))).status).toBe(400);
      expect(d.save).not.toHaveBeenCalled();
    },
  );
  it('rejects duplicated form fields', async () => {
    const f = form();
    f.append('count', '999');
    expect((await POST(request(f))).status).toBe(400);
  });
  it('requires an explanation below 50 bottles', async () => {
    const f = form();
    f.set('count', '20');
    expect((await POST(request(f))).status).toBe(400);
    f.set('note', 'Az automata megtelt.');
    expect((await POST(request(f))).status).toBe(201);
  });
  it('rejects missing and invalid images', async () => {
    const f = form();
    f.delete('receipt');
    expect((await POST(request(f))).status).toBe(400);
    f.set('receipt', new Blob(['not-image'], { type: 'image/jpeg' }), 'photo.jpg');
    expect((await POST(request(f))).status).toBe(400);
  });
  it('requires an idempotency key', async () => {
    expect((await POST(request(form(), { 'idempotency-key': 'bad' }))).status).toBe(400);
  });
  it('requires revision version', async () => {
    const f = form();
    f.set('revision', key);
    expect((await POST(request(f))).status).toBe(400);
  });
  it('reports revoked membership checked inside the transaction', async () => {
    d.save.mockRejectedValue(new TeacherUploadError('42501'));
    expect((await POST(request())).status).toBe(403);
  });
  it('reports simultaneous review/resubmission conflict', async () => {
    d.save.mockRejectedValue(new TeacherUploadError('40001'));
    expect((await POST(request())).status).toBe(409);
  });
  it('handles idempotent retries', async () => {
    d.save.mockResolvedValue({ publicReference: key, duplicate: true });
    expect((await POST(request())).status).toBe(200);
  });
  it('fails closed when no campaign exists', async () => {
    d.options.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(409);
    expect(d.save).not.toHaveBeenCalled();
  });
});
