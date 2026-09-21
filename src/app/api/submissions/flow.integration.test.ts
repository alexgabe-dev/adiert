// @vitest-environment node
import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const deps = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/supabase/admin', () => ({ createPrivilegedSupabaseClient: () => deps.client }));
vi.mock('@/features/teacher/server', () => ({
  teacherSession: async () => ({
    user: { id: '11111111-1111-4111-8111-111111111111' },
    membership: { school_id: '22222222-2222-4222-8222-222222222222' },
  }),
}));
vi.mock('@/lib/env', () => ({
  environment: { SITE_URL: 'http://localhost:3000' },
  getSubmissionSecurityEnvironment: () => ({
    SUBMISSION_RATE_LIMIT_SECRET: 'a-secret-with-at-least-thirty-two-characters',
  }),
}));
import { POST } from './route';
const campaign = '33333333-3333-4333-8333-333333333333';
const reference = '44444444-4444-4444-8444-444444444444';
let image: Buffer;
interface State {
  objects: Map<string, Buffer>;
  saved: Record<string, unknown> | null;
  fail: boolean;
}
let state: State;
function client() {
  return {
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (name === 'check_submission_rate_limit')
        return { data: [{ allowed: true, retry_after_seconds: 60 }], error: null };
      expect(name).toBe('save_teacher_submission');
      if (state.fail) return { data: null, error: { code: '40001' } };
      if (state.saved)
        return { data: [{ public_reference: reference, duplicate: true }], error: null };
      state.saved = args;
      return { data: [{ public_reference: reference, duplicate: false }], error: null };
    },
    storage: {
      from: () => ({
        upload: async (path: string, buffer: Buffer) => {
          state.objects.set(path, buffer);
          return { error: null };
        },
        remove: async (paths: string[]) => {
          paths.forEach((p) => state.objects.delete(p));
          return { error: null };
        },
      }),
    },
    from: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => ({
          data: {
            id: campaign,
            name: 'Campaign',
            start_date: '2000-01-01',
            end_date: '2099-12-31',
            active: true,
          },
          error: null,
        }),
      };
      return builder;
    },
  };
}
function request() {
  const f = new FormData();
  f.set('receipt', new Blob([image], { type: 'image/jpeg' }), 'private-name.jpg');
  f.set('count', '100');
  f.set('date', '2026-01-01');
  return new NextRequest('http://localhost:3000/api/submissions', {
    method: 'POST',
    body: f,
    headers: { origin: 'http://localhost:3000', 'idempotency-key': reference },
  });
}
describe('authenticated upload integration', () => {
  beforeAll(async () => {
    image = await sharp({ create: { width: 700, height: 900, channels: 3, background: '#eee' } })
      .withMetadata({ exif: { IFD0: { Artist: 'private metadata' } } })
      .jpeg()
      .toBuffer();
  });
  beforeEach(() => {
    state = { objects: new Map(), saved: null, fail: false };
    deps.client = client();
  });
  it('normalizes private photo, strips metadata and passes actor to atomic save', async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(state.saved).toMatchObject({
      p_user: '11111111-1111-4111-8111-111111111111',
      p_school: '22222222-2222-4222-8222-222222222222',
      p_count: 100,
    });
    expect(JSON.stringify(state.saved)).not.toContain('private-name');
    expect(state.saved).not.toHaveProperty('approved_amount');
    const stored = [...state.objects.values()][0];
    expect(stored).toBeDefined();
    expect((await sharp(stored).metadata()).exif).toBeUndefined();
  });
  it('retries without duplicating records or leaving a second image', async () => {
    expect((await POST(request())).status).toBe(201);
    expect((await POST(request())).status).toBe(200);
    expect(state.objects.size).toBe(1);
  });
  it('cleans up an upload when a known transactional conflict rolls back', async () => {
    state.fail = true;
    expect((await POST(request())).status).toBe(409);
    expect(state.objects.size).toBe(0);
  });
});
