import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { teacherSession } from '@/features/teacher/server';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { RECEIPT_BUCKET, SIGNED_RECEIPT_URL_TTL_SECONDS } from '@/features/submissions/constants';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await teacherSession();
  const { id } = await params;
  if (!session?.membership || !z.uuid().safeParse(id).success)
    return new NextResponse(null, { status: 404 });
  const { data, error } = await session.client
    .from('submissions')
    .select('receipt_image_path')
    .eq('id', id)
    .eq('school_id', session.membership.school_id)
    .maybeSingle();
  const privileged = createPrivilegedSupabaseClient();
  if (error || !data || !privileged) return new NextResponse(null, { status: 404 });
  const signed = await privileged.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(data.receipt_image_path, SIGNED_RECEIPT_URL_TTL_SECONDS);
  if (signed.error || !signed.data?.signedUrl) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(signed.data.signedUrl, {
    headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
