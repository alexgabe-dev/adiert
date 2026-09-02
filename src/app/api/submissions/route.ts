import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { MAX_RECEIPT_FILE_BYTES } from '@/features/submissions/constants';
import { normalizeReceiptImage, ReceiptImageError } from '@/features/submissions/image';
import {
  enforceSubmissionRateLimits,
  getOrCreateDeviceToken,
  getRequestAddress,
  hashSubmissionKey,
  SubmissionRateLimitError,
} from '@/features/submissions/rate-limit';
import { SubmissionRepositoryError } from '@/features/submissions/repository';
import {
  createPendingReceiptSubmission,
  SubmissionValidationError,
} from '@/features/submissions/service';
import { environment, getSubmissionSecurityEnvironment } from '@/lib/env';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const submissionFieldsSchema = z.object({
  campaignId: z.uuid(),
  schoolId: z.uuid(),
  idempotencyKey: z.uuid(),
});

const allowedFormFields = new Set(['campaign_id', 'school_id', 'receipt']);
const multipartOverheadAllowance = 512 * 1024;

function requestHasValidOrigin(request: NextRequest) {
  const originHeader = request.headers.get('origin');
  if (!originHeader) return false;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return false;

  try {
    const origin = new URL(originHeader).origin;
    const canonicalOrigin = new URL(environment.NEXT_PUBLIC_SITE_URL).origin;
    return origin === request.nextUrl.origin || origin === canonicalOrigin;
  } catch {
    return false;
  }
}

function imageErrorStatus(code: ReceiptImageError['code']) {
  if (code === 'oversized_file') return 413;
  if (code === 'unsupported_type') return 415;
  return 400;
}

export async function POST(request: NextRequest) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 415 });
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_RECEIPT_FILE_BYTES + multipartOverheadAllowance
  ) {
    return NextResponse.json({ error: 'oversized_file' }, { status: 413 });
  }

  const supabase = createPrivilegedSupabaseClient();
  const securityEnvironment = getSubmissionSecurityEnvironment();
  if (!supabase || !securityEnvironment) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const deviceToken = getOrCreateDeviceToken(
    request.cookies.get('adiert_submission_device')?.value,
  );

  try {
    await enforceSubmissionRateLimits(supabase, {
      address: getRequestAddress(request.headers),
      deviceToken,
      secret: securityEnvironment.SUBMISSION_RATE_LIMIT_SECRET,
    });
  } catch (error) {
    const retryAfter = error instanceof SubmissionRateLimitError ? error.retryAfterSeconds : 60;
    const status =
      error instanceof SubmissionRateLimitError && error.reason === 'limited' ? 429 : 503;
    return NextResponse.json(
      { error: status === 429 ? 'rate_limited' : 'unavailable' },
      { status, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  try {
    const formData = await request.formData();
    const formKeys = [...formData.keys()];
    if (
      formKeys.some((key) => !allowedFormFields.has(key)) ||
      formData.getAll('campaign_id').length !== 1 ||
      formData.getAll('school_id').length !== 1 ||
      formData.getAll('receipt').length !== 1
    ) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const parsedFields = submissionFieldsSchema.safeParse({
      campaignId: formData.get('campaign_id'),
      schoolId: formData.get('school_id'),
      idempotencyKey: request.headers.get('idempotency-key'),
    });
    if (!parsedFields.success) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const receipt = formData.get('receipt');
    const image = await normalizeReceiptImage(receipt instanceof File ? receipt : null);
    const result = await createPendingReceiptSubmission(supabase, {
      campaignId: parsedFields.data.campaignId,
      schoolId: parsedFields.data.schoolId,
      idempotencyKeyHash: hashSubmissionKey(
        securityEnvironment.SUBMISSION_RATE_LIMIT_SECRET,
        'idempotency',
        parsedFields.data.idempotencyKey,
      ),
      image,
    });

    const response = NextResponse.json(
      {
        publicReference: result.publicReference,
        status: 'pending',
      },
      { status: result.duplicate ? 200 : 201 },
    );
    response.cookies.set('adiert_submission_device', deviceToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/api/submissions',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (error) {
    if (error instanceof ReceiptImageError) {
      return NextResponse.json({ error: error.code }, { status: imageErrorStatus(error.code) });
    }
    if (error instanceof SubmissionValidationError) {
      return NextResponse.json({ error: 'invalid_selection' }, { status: 400 });
    }
    if (error instanceof SubmissionRepositoryError) {
      return NextResponse.json({ error: 'submission_failed' }, { status: 503 });
    }
    return NextResponse.json({ error: 'submission_failed' }, { status: 500 });
  }
}
