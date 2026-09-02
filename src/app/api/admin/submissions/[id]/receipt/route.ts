import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { SIGNED_RECEIPT_URL_TTL_SECONDS, RECEIPT_BUCKET } from '@/features/submissions/constants';
import { getReceiptPathForReview } from '@/features/admin/submissions';
import { getActiveAdministrator } from '@/lib/auth/authorization';
import { administratorHasRole } from '@/lib/auth/roles';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface ReceiptRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: ReceiptRouteContext) {
  const administrator = await getActiveAdministrator();
  if (!administrator || !administratorHasRole(administrator.role, 'reviewer')) {
    return new NextResponse(null, { status: 404 });
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });

  const authenticatedClient = await createServerSupabaseClient();
  const privilegedClient = createPrivilegedSupabaseClient();
  if (!authenticatedClient || !privilegedClient) {
    return new NextResponse(null, { status: 503 });
  }

  try {
    const path = await getReceiptPathForReview(authenticatedClient, id);
    if (!path) return new NextResponse(null, { status: 404 });
    const { data, error } = await privilegedClient.storage
      .from(RECEIPT_BUCKET)
      .createSignedUrl(path, SIGNED_RECEIPT_URL_TTL_SECONDS);
    if (error || !data.signedUrl) return new NextResponse(null, { status: 404 });

    const signedUrl = new URL(data.signedUrl);
    if (process.env.NODE_ENV === 'production' && signedUrl.protocol !== 'https:') {
      return new NextResponse(null, { status: 500 });
    }

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
