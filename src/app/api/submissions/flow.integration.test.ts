// @vitest-environment node

import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({ client: null as unknown }));

vi.mock('@/lib/supabase/admin', () => ({
  createPrivilegedSupabaseClient: () => dependencies.client,
}));
vi.mock('@/lib/env', () => ({
  environment: { SITE_URL: 'http://localhost:3000' },
  getSubmissionSecurityEnvironment: () => ({
    SUBMISSION_RATE_LIMIT_SECRET: 'a-secret-that-is-definitely-at-least-32-characters',
  }),
}));

import { POST } from '@/app/api/submissions/route';

const campaignId = '11111111-1111-4111-8111-111111111111';
const schoolId = '22222222-2222-4222-8222-222222222222';
const idempotencyKey = '33333333-3333-4333-8333-333333333333';
let jpeg: Buffer;

interface TestState {
  inserted: Record<string, unknown> | null;
  objects: Map<string, Buffer>;
  uploadCount: number;
  rateLimitChecks: number;
}

function createInMemorySupabase(state: TestState) {
  return {
    rpc: async (name: string) => {
      expect(name).toBe('check_submission_rate_limit');
      state.rateLimitChecks += 1;
      return { data: [{ allowed: true, retry_after_seconds: 60 }], error: null };
    },
    storage: {
      from: () => ({
        upload: async (path: string, buffer: Buffer) => {
          state.uploadCount += 1;
          state.objects.set(path, Buffer.from(buffer));
          return { error: null };
        },
        remove: async (paths: string[]) => {
          paths.forEach((path) => state.objects.delete(path));
          return { error: null };
        },
      }),
    },
    from: (table: string) => {
      const filters = new Map<string, unknown>();
      let insertValue: Record<string, unknown> | null = null;
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => {
          filters.set(column, value);
          return builder;
        },
        insert: (value: Record<string, unknown>) => {
          insertValue = value;
          return builder;
        },
        maybeSingle: async () => {
          if (table === 'submissions') {
            const matches =
              state.inserted?.idempotency_key_hash === filters.get('idempotency_key_hash');
            return {
              data: matches ? { public_reference: state.inserted?.public_reference } : null,
              error: null,
            };
          }
          if (table === 'campaigns') {
            return {
              data: {
                id: campaignId,
                name: 'Live campaign',
                start_date: '2000-01-01',
                end_date: '2099-12-31',
                active: true,
              },
              error: null,
            };
          }
          if (table === 'schools') {
            return {
              data: { id: schoolId, name: 'School', city: 'Budapest', active: true },
              error: null,
            };
          }
          return { data: { school_id: schoolId, active: true }, error: null };
        },
        single: async () => {
          expect(table).toBe('submissions');
          expect(insertValue).not.toBeNull();
          state.inserted = insertValue;
          return {
            data: { public_reference: insertValue?.public_reference },
            error: null,
          };
        },
      };
      return builder;
    },
  };
}

function request() {
  const form = new FormData();
  form.set('campaign_id', campaignId);
  form.set('school_id', schoolId);
  form.set('receipt', new Blob([jpeg], { type: 'image/jpeg' }), 'client-name.jpg');
  return new NextRequest('http://localhost:3000/api/submissions', {
    method: 'POST',
    body: form,
    headers: {
      origin: 'http://localhost:3000',
      'sec-fetch-site': 'same-origin',
      'idempotency-key': idempotencyKey,
      'x-forwarded-for': '203.0.113.25',
    },
  });
}

describe('secure receipt submission integration', () => {
  beforeAll(async () => {
    jpeg = await sharp({
      create: { width: 700, height: 900, channels: 3, background: '#eeeeee' },
    })
      .withMetadata({ exif: { IFD0: { Artist: 'private metadata' } } })
      .jpeg()
      .toBuffer();
  });

  let state: TestState;
  beforeEach(() => {
    state = { inserted: null, objects: new Map(), uploadCount: 0, rateLimitChecks: 0 };
    dependencies.client = createInMemorySupabase(state);
  });

  it('runs HTTP validation, abuse checks, normalization, private upload, and pending insert end to end', async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ status: 'pending' });
    expect(state.rateLimitChecks).toBe(5);
    expect(state.uploadCount).toBe(1);
    expect(state.inserted).toMatchObject({
      campaign_id: campaignId,
      school_id: schoolId,
      status: 'pending',
      ocr_status: 'not_requested',
      approved_amount: null,
      approved_bottle_count: null,
      detected_amount: null,
      detected_bottle_count: null,
    });
    expect(state.inserted?.receipt_image_path).toMatch(
      new RegExp(`^${campaignId}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.jpg$`, 'i'),
    );
    expect(JSON.stringify(state.inserted)).not.toContain('client-name.jpg');
    const stored = [...state.objects.values()][0];
    expect(stored).toBeDefined();
    const metadata = await sharp(stored).metadata();
    expect(metadata.format).toBe('jpeg');
    expect(metadata.exif).toBeUndefined();
  });

  it('returns the original public reference without a second object on retry', async () => {
    const first = await POST(request());
    const firstBody = await first.json();
    const second = await POST(request());
    const secondBody = await second.json();

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(secondBody.publicReference).toBe(firstBody.publicReference);
    expect(state.uploadCount).toBe(1);
    expect(state.objects.size).toBe(1);
  });
});
