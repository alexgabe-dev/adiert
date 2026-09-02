// @vitest-environment node

import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({
  enforceSubmissionRateLimits: vi.fn(),
  createPendingReceiptSubmission: vi.fn(),
  createPrivilegedSupabaseClient: vi.fn(() => ({ kind: 'service-role-client' })),
}));

vi.mock('@/features/submissions/rate-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/submissions/rate-limit')>()),
  enforceSubmissionRateLimits: dependencies.enforceSubmissionRateLimits,
}));

vi.mock('@/features/submissions/service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/submissions/service')>()),
  createPendingReceiptSubmission: dependencies.createPendingReceiptSubmission,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createPrivilegedSupabaseClient: dependencies.createPrivilegedSupabaseClient,
}));

vi.mock('@/lib/env', () => ({
  environment: { SITE_URL: 'http://localhost:3000' },
  getSubmissionSecurityEnvironment: () => ({
    SUBMISSION_RATE_LIMIT_SECRET: 'a-secret-that-is-definitely-at-least-32-characters',
  }),
}));

import { MAX_RECEIPT_FILE_BYTES } from '@/features/submissions/constants';
import { SubmissionRateLimitError } from '@/features/submissions/rate-limit';
import { SubmissionValidationError } from '@/features/submissions/service';
import { POST } from '@/app/api/submissions/route';

const campaignId = '11111111-1111-4111-8111-111111111111';
const schoolId = '22222222-2222-4222-8222-222222222222';
const idempotencyKey = '33333333-3333-4333-8333-333333333333';
const publicReference = '44444444-4444-4444-8444-444444444444';
let jpeg: Buffer;

function formRequest(formData: FormData, extraHeaders?: Record<string, string>) {
  return new NextRequest('http://localhost:3000/api/submissions', {
    method: 'POST',
    body: formData,
    headers: {
      origin: 'http://localhost:3000',
      'sec-fetch-site': 'same-origin',
      'idempotency-key': idempotencyKey,
      ...extraHeaders,
    },
  });
}

function validForm() {
  const form = new FormData();
  form.set('campaign_id', campaignId);
  form.set('school_id', schoolId);
  form.set('receipt', new Blob([jpeg], { type: 'image/jpeg' }), 'untrusted-name.jpg');
  return form;
}

describe('POST /api/submissions', () => {
  beforeAll(async () => {
    jpeg = await sharp({
      create: { width: 500, height: 700, channels: 3, background: '#ffffff' },
    })
      .jpeg()
      .toBuffer();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.enforceSubmissionRateLimits.mockResolvedValue(undefined);
    dependencies.createPendingReceiptSubmission.mockResolvedValue({
      publicReference,
      duplicate: false,
    });
  });

  it('accepts a valid image and creates only a pending submission', async () => {
    const response = await POST(formRequest(validForm()));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ publicReference, status: 'pending' });
    expect(dependencies.createPendingReceiptSubmission).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ campaignId, schoolId }),
    );
    const input = dependencies.createPendingReceiptSubmission.mock.calls[0]?.[1];
    expect(input).not.toHaveProperty('approved_amount');
    expect(input).not.toHaveProperty('status');
    expect(input.image.contentType).toBe('image/jpeg');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  });

  it.each(['campaign', 'school', 'participation'] as const)(
    'rejects an invalid %s selection',
    async (reason) => {
      dependencies.createPendingReceiptSubmission.mockRejectedValue(
        new SubmissionValidationError(reason),
      );
      const response = await POST(formRequest(validForm()));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'invalid_selection' });
    },
  );

  it('rejects a missing receipt', async () => {
    const form = new FormData();
    form.set('campaign_id', campaignId);
    form.set('school_id', schoolId);
    const response = await POST(formRequest(form));
    expect(response.status).toBe(400);
    expect(dependencies.createPendingReceiptSubmission).not.toHaveBeenCalled();
  });

  it('rejects an unsupported file signature', async () => {
    const form = validForm();
    form.set('receipt', new Blob(['%PDF malicious'], { type: 'image/jpeg' }), 'receipt.jpg');
    const response = await POST(formRequest(form));
    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({ error: 'unsupported_type' });
  });

  it('rejects an oversized request before parsing its body', async () => {
    const response = await POST(
      formRequest(validForm(), { 'content-length': String(MAX_RECEIPT_FILE_BYTES + 600_000) }),
    );
    expect(response.status).toBe(413);
    expect(dependencies.enforceSubmissionRateLimits).not.toHaveBeenCalled();
  });

  it.each(['status', 'approved_amount', 'approved_bottle_count', 'student_name'])(
    'rejects the client-controlled %s field',
    async (field) => {
      const form = validForm();
      form.set(field, 'approved');
      const response = await POST(formRequest(form));
      expect(response.status).toBe(400);
      expect(dependencies.createPendingReceiptSubmission).not.toHaveBeenCalled();
    },
  );

  it('rejects cross-origin requests before consuming rate-limit capacity', async () => {
    const request = formRequest(validForm());
    request.headers.set('origin', 'https://attacker.example');
    request.headers.set('sec-fetch-site', 'cross-site');
    const response = await POST(request);
    expect(response.status).toBe(403);
    expect(dependencies.enforceSubmissionRateLimits).not.toHaveBeenCalled();
  });

  it('returns the same reference for an idempotent retry', async () => {
    dependencies.createPendingReceiptSubmission.mockResolvedValue({
      publicReference,
      duplicate: true,
    });
    const response = await POST(formRequest(validForm()));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ publicReference, status: 'pending' });
  });

  it('returns 429 with a bounded retry instruction when rate limited', async () => {
    dependencies.enforceSubmissionRateLimits.mockRejectedValue(
      new SubmissionRateLimitError('limited', 120),
    );
    const response = await POST(formRequest(validForm()));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('120');
    expect(dependencies.createPendingReceiptSubmission).not.toHaveBeenCalled();
  });
});
