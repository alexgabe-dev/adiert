import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedReceiptImage } from '@/features/submissions/image';
import { uploadReceiptImage, removeReceiptImage } from '@/features/submissions/repository';
import { z } from 'zod';
export class TeacherUploadError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export async function saveTeacherUpload(
  client: SupabaseClient,
  input: {
    userId: string;
    schoolId: string;
    campaignId: string;
    key: string;
    count: number;
    date: string;
    note: string;
    revision?: string;
    version?: number;
    image: NormalizedReceiptImage;
  },
) {
  const id = input.revision ?? randomUUID();
  const path = `${input.campaignId}/${id}/${randomUUID()}.${input.image.extension}`;
  await uploadReceiptImage(client, path, input.image);
  const { data, error } = await client.rpc('save_teacher_submission', {
    p_user: input.userId,
    p_school: input.schoolId,
    p_campaign: input.campaignId,
    p_id: id,
    p_path: path,
    p_hash: input.image.sha256,
    p_key: input.key,
    p_count: input.count,
    p_date: input.date,
    p_note: input.note,
    p_revision: input.revision ?? null,
    p_version: input.version ?? null,
  });
  if (error) {
    // Only a confirmed SQL rollback is safe to clean up. A network failure may hide a commit.
    if (['40001', '42501', '22023', '23514', '23505', '55000', 'P0002'].includes(error.code ?? ''))
      await removeReceiptImage(client, path);
    throw new TeacherUploadError(error.code ?? 'failed');
  }
  const parsed = z
    .array(z.object({ public_reference: z.uuid(), duplicate: z.boolean() }))
    .length(1)
    .safeParse(data);
  // Never delete an uploaded object when the database outcome is unknown.
  if (!parsed.success) throw new TeacherUploadError('failed');
  const result = parsed.data[0]!;
  if (result.duplicate) await removeReceiptImage(client, path);
  return { publicReference: result.public_reference, duplicate: result.duplicate };
}
