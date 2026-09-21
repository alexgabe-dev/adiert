// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/features/teacher/notifications', () => ({
  scheduleNotifications: vi.fn(),
}));

const dependencies = vi.hoisted(() => ({
  requestHeaders: new Headers(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  requireAdministratorRole: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: async () => dependencies.requestHeaders }));
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

import { initialReviewActionState, reviewSubmissionAction } from '@/features/admin/review-action';

const submissionId = '11111111-1111-4111-8111-111111111111';

function form(intent: 'approved' | 'rejected' | 'needs_review') {
  const data = new FormData();
  data.set('submission_id', submissionId);
  data.set('expected_version', '1');
  data.set('intent', intent);
  data.set('approved_amount', '');
  data.set('approved_bottle_count', '');
  data.set('receipt_identifier', '');
  data.set('receipt_date', '');
  data.set('reason', '');
  return data;
}

describe('reviewSubmissionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.requestHeaders = new Headers({
      origin: 'https://adiert.example',
      host: 'adiert.example',
    });
    dependencies.requireAdministratorRole.mockResolvedValue({ role: 'reviewer' });
    dependencies.rpc.mockResolvedValue({ error: null });
    dependencies.createServerSupabaseClient.mockResolvedValue({ rpc: dependencies.rpc });
  });

  it('rejects a cross-origin mutation before authentication or database access', async () => {
    dependencies.requestHeaders.set('origin', 'https://attacker.example');
    const result = await reviewSubmissionAction(initialReviewActionState, form('needs_review'));
    expect(result.status).toBe('error');
    expect(dependencies.requireAdministratorRole).not.toHaveBeenCalled();
    expect(dependencies.rpc).not.toHaveBeenCalled();
  });

  it('requires an active reviewer role for every mutation', async () => {
    await reviewSubmissionAction(initialReviewActionState, form('needs_review'));
    expect(dependencies.requireAdministratorRole).toHaveBeenCalledWith('reviewer');
  });

  it('requires approved amount and bottle count for approval', async () => {
    const result = await reviewSubmissionAction(initialReviewActionState, form('approved'));
    expect(result.status).toBe('error');
    expect(dependencies.rpc).not.toHaveBeenCalled();
  });

  it('requires a nonblank rejection reason', async () => {
    const result = await reviewSubmissionAction(initialReviewActionState, form('rejected'));
    expect(result.status).toBe('error');
    expect(dependencies.rpc).not.toHaveBeenCalled();
  });

  it('sends a validated approval to the transactional review RPC', async () => {
    const data = form('approved');
    data.set('approved_amount', '5000');
    data.set('approved_bottle_count', '100');
    data.set('receipt_identifier', ' RECEIPT-42 ');
    data.set('receipt_date', '2026-09-02');
    data.set('reason', ' checked ');

    const result = await reviewSubmissionAction(initialReviewActionState, data);
    expect(result.status).toBe('success');
    expect(dependencies.rpc).toHaveBeenCalledWith('review_submission', {
      requested_submission_id: submissionId,
      expected_version: 1,
      requested_status: 'approved',
      requested_approved_amount: 5000,
      requested_approved_bottle_count: 100,
      requested_receipt_identifier: 'RECEIPT-42',
      requested_receipt_date: '2026-09-02',
      requested_reason: 'checked',
    });
    expect(dependencies.revalidatePath).toHaveBeenCalledWith('/admin/bekuldesek');
    expect(dependencies.revalidatePath).toHaveBeenCalledWith(`/admin/bekuldesek/${submissionId}`);
    expect(dependencies.revalidateTag).toHaveBeenCalledWith('public-campaign', 'max');
  });

  it('reports an optimistic-lock conflict without claiming success', async () => {
    dependencies.rpc.mockResolvedValue({ error: { code: '40001' } });
    const data = form('needs_review');
    data.set('reason', 'A fotó nem olvasható.');
    const result = await reviewSubmissionAction(initialReviewActionState, data);
    expect(result.status).toBe('error');
    expect(result.message).toContain('más módosította');
    expect(dependencies.revalidatePath).not.toHaveBeenCalled();
  });
});
