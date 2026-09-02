import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { querySchoolSearch } from '@/features/public-data/repository';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const searchSchema = z
  .object({
    query: z.string().trim().max(120).default(''),
    campaignId: z.uuid().optional(),
    schoolId: z.uuid().optional(),
  })
  .refine((value) => value.schoolId || value.query.length >= 2, {
    message: 'At least two search characters are required',
  });

export async function GET(request: NextRequest) {
  const parsed = searchSchema.safeParse({
    query: request.nextUrl.searchParams.get('query') ?? '',
    campaignId: request.nextUrl.searchParams.get('campaign_id') || undefined,
    schoolId: request.nextUrl.searchParams.get('school_id') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  const client = createPrivilegedSupabaseClient();
  if (!client) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  try {
    const results = await querySchoolSearch(client, {
      query: parsed.data.query,
      campaignId: parsed.data.campaignId,
      schoolId: parsed.data.schoolId,
      limit: 15,
    });
    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
    );
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
