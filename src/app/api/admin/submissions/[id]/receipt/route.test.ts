// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({
  getActiveAdministrator: vi.fn(),
  getReceiptPathForReview: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  createPrivilegedSupabaseClient: vi.fn(),
  createSignedUrl: vi.fn(),
}));

vi.mock('@/lib/auth/authorization', () => ({
  getActiveAdministrator: dependencies.getActiveAdministrator,
}));
vi.mock('@/features/admin/submissions', () => ({
  getReceiptPathForReview: dependencies.getReceiptPathForReview,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: dependencies.createServerSupabaseClient,
}));
vi.mock('@/lib/supabase/admin', () => ({
  createPrivilegedSupabaseClient: dependencies.createPrivilegedSupabaseClient,
}));

import { SIGNED_RECEIPT_URL_TTL_SECONDS } from '@/features/submissions/constants';
import { GET } from '@/app/api/admin/submissions/[id]/receipt/route';

const submissionId = '11111111-1111-4111-8111-111111111111';
const authenticatedClient = { kind: 'authenticated-rls-client' };

function request() {
  return new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}/receipt`);
}

function context(id = submissionId) {
  return { params: Promise.resolve({ id }) };
}

describe('GET authorized receipt image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.getActiveAdministrator.mockResolvedValue({
      userId: '22222222-2222-4222-8222-222222222222',
      email: 'reviewer@example.com',
      role: 'reviewer',
      displayName: 'Reviewer',
    });
    dependencies.createServerSupabaseClient.mockResolvedValue(authenticatedClient);
    dependencies.getReceiptPathForReview.mockResolvedValue(
      `${submissionId}/${submissionId}/receipt.jpg`,
    );
    dependencies.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example/private-signed-url' },
      error: null,
    });
    dependencies.createPrivilegedSupabaseClient.mockReturnValue({
      storage: {
        from: vi.fn(() => ({ createSignedUrl: dependencies.createSignedUrl })),
      },
    });
  });

  it('conceals receipt access from anonymous and inactive users', async () => {
    dependencies.getActiveAdministrator.mockResolvedValue(null);
    const response = await GET(request(), context());
    expect(response.status).toBe(404);
    expect(dependencies.getReceiptPathForReview).not.toHaveBeenCalled();
    expect(dependencies.createSignedUrl).not.toHaveBeenCalled();
  });

  it('rejects malformed identifiers before database or Storage access', async () => {
    const response = await GET(request(), context('not-a-uuid'));
    expect(response.status).toBe(404);
    expect(dependencies.getReceiptPathForReview).not.toHaveBeenCalled();
  });

  it('uses authenticated RLS to locate a receipt and redirects to a short-lived signed URL', async () => {
    const response = await GET(request(), context());
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://storage.example/private-signed-url');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(dependencies.getReceiptPathForReview).toHaveBeenCalledWith(
      authenticatedClient,
      submissionId,
    );
    expect(dependencies.createSignedUrl).toHaveBeenCalledWith(
      `${submissionId}/${submissionId}/receipt.jpg`,
      SIGNED_RECEIPT_URL_TTL_SECONDS,
    );
  });

  it('conceals missing receipt paths and signing failures', async () => {
    dependencies.getReceiptPathForReview.mockResolvedValueOnce(null);
    expect((await GET(request(), context())).status).toBe(404);

    dependencies.createSignedUrl.mockResolvedValueOnce({
      data: null,
      error: { message: 'denied' },
    });
    expect((await GET(request(), context())).status).toBe(404);
  });
});
