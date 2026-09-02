'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

import { requireAdministratorRole } from '@/lib/auth/authorization';
import { hasValidMutationOrigin } from '@/lib/security/origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const optionalPositiveInteger = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const reviewActionSchema = z.object({
  submissionId: z.uuid(),
  expectedVersion: z.coerce.number().int().positive(),
  intent: z.enum(['approved', 'rejected', 'needs_review']),
  approvedAmount: optionalPositiveInteger,
  approvedBottleCount: optionalPositiveInteger,
  receiptIdentifier: z.string().trim().max(200).optional(),
  receiptDate: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.iso.date().optional(),
  ),
  reason: z.string().trim().max(500).optional(),
});

export interface ReviewActionState {
  status: 'idle' | 'error' | 'success';
  message: string;
}

export const initialReviewActionState: ReviewActionState = { status: 'idle', message: '' };

export async function reviewSubmissionAction(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  if (!(await hasValidMutationOrigin())) {
    return { status: 'error', message: 'Érvénytelen kérés.' };
  }

  await requireAdministratorRole('reviewer');
  const parsed = reviewActionSchema.safeParse({
    submissionId: formData.get('submission_id'),
    expectedVersion: formData.get('expected_version'),
    intent: formData.get('intent'),
    approvedAmount: formData.get('approved_amount'),
    approvedBottleCount: formData.get('approved_bottle_count'),
    receiptIdentifier: formData.get('receipt_identifier'),
    receiptDate: formData.get('receipt_date'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Ellenőrizd a megadott adatokat.' };
  }

  if (
    parsed.data.intent === 'approved' &&
    (!parsed.data.approvedAmount || !parsed.data.approvedBottleCount)
  ) {
    return { status: 'error', message: 'A jóváhagyáshoz összeg és palackszám szükséges.' };
  }
  if (parsed.data.intent === 'rejected' && !parsed.data.reason) {
    return { status: 'error', message: 'Az elutasításhoz indoklás szükséges.' };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { status: 'error', message: 'A művelet átmenetileg nem érhető el.' };

  const { error } = await supabase.rpc('review_submission', {
    requested_submission_id: parsed.data.submissionId,
    expected_version: parsed.data.expectedVersion,
    requested_status: parsed.data.intent,
    requested_approved_amount: parsed.data.approvedAmount ?? null,
    requested_approved_bottle_count: parsed.data.approvedBottleCount ?? null,
    requested_receipt_identifier: parsed.data.receiptIdentifier || null,
    requested_receipt_date: parsed.data.receiptDate ?? null,
    requested_reason: parsed.data.reason || null,
  });

  if (error) {
    if (error.code === '40001') {
      return {
        status: 'error',
        message: 'A beküldést közben más módosította. Frissítsd az oldalt és ellenőrizd újra.',
      };
    }
    if (error.code === '23505') {
      return {
        status: 'error',
        message: 'Ez a bizonylatazonosító már jóváhagyott beküldéshez tartozik.',
      };
    }
    return { status: 'error', message: 'A felülvizsgálat nem menthető ebben az állapotban.' };
  }

  revalidatePath('/admin/bekuldesek');
  revalidatePath(`/admin/bekuldesek/${parsed.data.submissionId}`);
  if (parsed.data.intent === 'approved') {
    revalidateTag('public-campaign', 'max');
    revalidatePath('/');
    revalidatePath('/iskolak/[slug]', 'page');
  }
  return { status: 'success', message: 'A felülvizsgálat és az auditbejegyzés sikeresen mentve.' };
}
