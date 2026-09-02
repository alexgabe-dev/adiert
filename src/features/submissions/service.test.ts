// @vitest-environment node

import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const repository = vi.hoisted(() => ({
  findSubmissionByIdempotencyKey: vi.fn(),
  insertPendingSubmission: vi.fn(),
  removeReceiptImage: vi.fn(),
  uploadReceiptImage: vi.fn(),
  validateCampaignSchool: vi.fn(),
}));

vi.mock('@/features/submissions/repository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/submissions/repository')>()),
  ...repository,
}));

import type { NormalizedReceiptImage } from '@/features/submissions/image';
import { SubmissionRepositoryError } from '@/features/submissions/repository';
import {
  createPendingReceiptSubmission,
  SubmissionValidationError,
} from '@/features/submissions/service';

const client = {} as SupabaseClient;
const campaignId = '11111111-1111-4111-8111-111111111111';
const schoolId = '22222222-2222-4222-8222-222222222222';
const publicReference = '33333333-3333-4333-8333-333333333333';
const image: NormalizedReceiptImage = {
  buffer: Buffer.from('safe-jpeg'),
  contentType: 'image/jpeg',
  extension: 'jpg',
  sha256: 'a'.repeat(64),
  width: 800,
  height: 1200,
};

function submit() {
  return createPendingReceiptSubmission(client, {
    campaignId,
    schoolId,
    idempotencyKeyHash: 'b'.repeat(64),
    image,
  });
}

describe('createPendingReceiptSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.findSubmissionByIdempotencyKey.mockResolvedValue(null);
    repository.validateCampaignSchool.mockResolvedValue({ valid: true });
    repository.uploadReceiptImage.mockResolvedValue(undefined);
    repository.insertPendingSubmission.mockResolvedValue(publicReference);
    repository.removeReceiptImage.mockResolvedValue(undefined);
  });

  it('uploads to a server-generated path and inserts one pending submission', async () => {
    await expect(submit()).resolves.toEqual({ publicReference, duplicate: false });

    expect(repository.uploadReceiptImage).toHaveBeenCalledTimes(1);
    const path = repository.uploadReceiptImage.mock.calls[0]?.[1] as string;
    expect(path).toMatch(new RegExp(`^${campaignId}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.jpg$`, 'i'));
    expect(repository.insertPendingSubmission).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        campaignId,
        schoolId,
        path,
        sha256: image.sha256,
        idempotencyKeyHash: 'b'.repeat(64),
      }),
    );
  });

  it('returns an idempotent result without another upload', async () => {
    repository.findSubmissionByIdempotencyKey.mockResolvedValue(publicReference);
    await expect(submit()).resolves.toEqual({ publicReference, duplicate: true });
    expect(repository.validateCampaignSchool).not.toHaveBeenCalled();
    expect(repository.uploadReceiptImage).not.toHaveBeenCalled();
    expect(repository.insertPendingSubmission).not.toHaveBeenCalled();
  });

  it.each(['campaign', 'school', 'participation'] as const)(
    'rejects invalid %s selection before uploading',
    async (reason) => {
      repository.validateCampaignSchool.mockResolvedValue({ valid: false, reason });
      await expect(submit()).rejects.toEqual(new SubmissionValidationError(reason));
      expect(repository.uploadReceiptImage).not.toHaveBeenCalled();
    },
  );

  it('removes the receipt if the database insert fails', async () => {
    repository.insertPendingSubmission.mockRejectedValue(new SubmissionRepositoryError('insert'));
    await expect(submit()).rejects.toMatchObject({ operation: 'insert' });
    const path = repository.uploadReceiptImage.mock.calls[0]?.[1];
    expect(repository.removeReceiptImage).toHaveBeenCalledWith(client, path);
  });

  it('resolves a concurrent retry without leaving the losing upload', async () => {
    repository.findSubmissionByIdempotencyKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(publicReference);
    repository.insertPendingSubmission.mockRejectedValue(
      new SubmissionRepositoryError('insert', '23505'),
    );

    await expect(submit()).resolves.toEqual({ publicReference, duplicate: true });
    expect(repository.removeReceiptImage).toHaveBeenCalledTimes(1);
  });
});
