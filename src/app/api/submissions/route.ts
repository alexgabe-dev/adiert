import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { teacherSession } from '@/features/teacher/server';
import { uploadDetailsSchema } from '@/features/teacher/shared';
import { saveTeacherUpload, TeacherUploadError } from '@/features/teacher/upload';
import { MAX_RECEIPT_FILE_BYTES } from '@/features/submissions/constants';
import { normalizeReceiptImage, ReceiptImageError } from '@/features/submissions/image';
import {
  enforceSubmissionRateLimits,
  hashSubmissionKey,
  SubmissionRateLimitError,
} from '@/features/submissions/rate-limit';
import { getPublicSubmissionOptions } from '@/features/submissions/repository';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { environment, getSubmissionSecurityEnvironment } from '@/lib/env';
export const runtime = 'nodejs';
const allowed = new Set(['receipt', 'count', 'date', 'note', 'revision', 'version']);
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (
    !origin ||
    ![request.nextUrl.origin, environment.SITE_URL].includes(origin) ||
    (request.headers.get('sec-fetch-site') &&
      request.headers.get('sec-fetch-site') !== 'same-origin')
  )
    return NextResponse.json({ error: 'invalid_request' }, { status: 403 });
  const session = await teacherSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!session.membership) return NextResponse.json({ error: 'not_member' }, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data;'))
    return NextResponse.json({ error: 'invalid_request' }, { status: 415 });
  if (Number(request.headers.get('content-length')) > MAX_RECEIPT_FILE_BYTES + 512 * 1024)
    return NextResponse.json({ error: 'oversized_file' }, { status: 413 });
  const client = createPrivilegedSupabaseClient();
  const security = getSubmissionSecurityEnvironment();
  if (!client || !security) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  try {
    await enforceSubmissionRateLimits(client, {
      address: session.user.id,
      deviceToken: session.user.id,
      secret: security.SUBMISSION_RATE_LIMIT_SECRET,
    });
    const form = await request.formData();
    if ([...form.keys()].some((k) => !allowed.has(k) || form.getAll(k).length !== 1))
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    const key = z.uuid().safeParse(request.headers.get('idempotency-key'));
    const details = uploadDetailsSchema.safeParse({
      count: form.get('count'),
      date: form.get('date'),
      note: form.get('note') ?? '',
      revision: form.get('revision'),
      version: form.get('version'),
    });
    if (!key.success || !details.success)
      return NextResponse.json({ error: 'invalid_details' }, { status: 400 });
    const options = await getPublicSubmissionOptions(client);
    if (!options) return NextResponse.json({ error: 'no_campaign' }, { status: 409 });
    const image = await normalizeReceiptImage(
      form.get('receipt') instanceof File ? (form.get('receipt') as File) : null,
    );
    const result = await saveTeacherUpload(client, {
      userId: session.user.id,
      schoolId: session.membership.school_id,
      campaignId: options.campaign.id,
      key: hashSubmissionKey(
        security.SUBMISSION_RATE_LIMIT_SECRET,
        'idempotency',
        `${session.user.id}:${key.data}`,
      ),
      ...details.data,
      image,
    });
    return NextResponse.json(
      { publicReference: result.publicReference, status: 'pending' },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof ReceiptImageError)
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'oversized_file' ? 413 : 400 },
      );
    if (error instanceof SubmissionRateLimitError)
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      );
    if (error instanceof TeacherUploadError)
      return NextResponse.json(
        {
          error:
            error.code === '40001'
              ? 'conflict'
              : error.code === '42501'
                ? 'not_member'
                : 'invalid_details',
        },
        { status: error.code === '42501' ? 403 : 409 },
      );
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
