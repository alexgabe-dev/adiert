import { NextRequest, NextResponse } from 'next/server';
import { getActiveAdministrator } from '@/lib/auth/authorization';
import { administratorHasRole } from '@/lib/auth/roles';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { hasValidMutationOrigin } from '@/lib/security/origin';
import { MAX_NEWS_IMAGE_BYTES } from '@/features/news/image-shared';
import { NewsImageError, normalizeNewsImage, storeNewsImage } from '@/features/news/image';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
  if (!(await hasValidMutationOrigin())) return fail('Érvénytelen kérés.', 403);
  const admin = await getActiveAdministrator();
  if (!admin || !administratorHasRole(admin.role, 'admin'))
    return fail('Nincs jogosultság a feltöltéshez.', 403);
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data;'))
    return fail('Érvénytelen kérés.', 415);
  const maxBody = MAX_NEWS_IMAGE_BYTES + 64 * 1024;
  if (Number(request.headers.get('content-length')) > maxBody)
    return fail('A kép legfeljebb 4 MB lehet.', 413);
  const client = createPrivilegedSupabaseClient();
  if (!client) return fail('A képfeltöltés nem érhető el.', 503);
  try {
    // Bound the actual stream as well as Content-Length before parsing multipart.
    const reader = request.body?.getReader();
    if (!reader) return fail('Válassz egy képet.', 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBody) {
        await reader.cancel();
        return fail('A kép legfeljebb 4 MB lehet.', 413);
      }
      chunks.push(value);
    }
    let form: FormData;
    try {
      form = await new Response(Buffer.concat(chunks), {
        headers: { 'Content-Type': request.headers.get('content-type')! },
      }).formData();
    } catch {
      return fail('Érvénytelen feltöltés.', 400);
    }
    const file = form.get('image');
    if (!(file instanceof File) || form.getAll('image').length !== 1)
      return fail('Válassz egy képet.', 400);
    const image = await normalizeNewsImage(file);
    const result = await storeNewsImage(client, admin.userId, image);
    return NextResponse.json(result, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof NewsImageError) return fail(error.message, error.status);
    return fail('A képfeltöltés nem sikerült. Próbáld újra.', 503);
  }
}
