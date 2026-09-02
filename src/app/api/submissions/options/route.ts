import { NextResponse } from 'next/server';

import { getPublicSubmissionOptions } from '@/features/submissions/repository';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createPrivilegedSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  try {
    const options = await getPublicSubmissionOptions(supabase);
    if (!options) {
      return NextResponse.json({ error: 'no_active_campaign' }, { status: 404 });
    }

    return NextResponse.json(options, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
