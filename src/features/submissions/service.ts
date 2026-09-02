import 'server-only';

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { NormalizedReceiptImage } from '@/features/submissions/image';
import {
  findSubmissionByIdempotencyKey,
  insertPendingSubmission,
  removeReceiptImage,
  SubmissionRepositoryError,
  uploadReceiptImage,
  validateCampaignSchool,
} from '@/features/submissions/repository';

export class SubmissionValidationError extends Error {
  constructor(public readonly reason: 'campaign' | 'school' | 'participation') {
    super(reason);
    this.name = 'SubmissionValidationError';
  }
}

export async function createPendingReceiptSubmission(
  client: SupabaseClient,
  input: {
    campaignId: string;
    schoolId: string;
    idempotencyKeyHash: string;
    image: NormalizedReceiptImage;
  },
) {
  const existingReference = await findSubmissionByIdempotencyKey(client, input.idempotencyKeyHash);
  if (existingReference) {
    return { publicReference: existingReference, duplicate: true };
  }

  const validation = await validateCampaignSchool(client, input.campaignId, input.schoolId);
  if (!validation.valid) {
    throw new SubmissionValidationError(validation.reason);
  }

  const submissionId = randomUUID();
  const publicReference = randomUUID();
  const objectName = randomUUID();
  const path = `${input.campaignId}/${submissionId}/${objectName}.${input.image.extension}`;

  await uploadReceiptImage(client, path, input.image);

  try {
    const insertedReference = await insertPendingSubmission(client, {
      id: submissionId,
      publicReference,
      campaignId: input.campaignId,
      schoolId: input.schoolId,
      path,
      sha256: input.image.sha256,
      idempotencyKeyHash: input.idempotencyKeyHash,
    });
    return { publicReference: insertedReference, duplicate: false };
  } catch (error) {
    await removeReceiptImage(client, path);

    if (error instanceof SubmissionRepositoryError && error.databaseCode === '23505') {
      const concurrentReference = await findSubmissionByIdempotencyKey(
        client,
        input.idempotencyKeyHash,
      );
      if (concurrentReference) {
        return { publicReference: concurrentReference, duplicate: true };
      }
    }

    throw error;
  }
}
