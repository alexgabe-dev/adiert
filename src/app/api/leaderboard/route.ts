import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { queryCampaignSummary, queryLeaderboard } from '@/features/public-data/repository';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const filtersSchema = z.object({
  query: z.string().trim().max(120).default(''),
  county: z.string().trim().max(80).default(''),
  city: z.string().trim().max(80).default(''),
  type: z
    .enum([
      'kindergarten',
      'primary_school',
      'secondary_school',
      'vocational_school',
      'special_school',
      'other',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export async function GET(request: NextRequest) {
  const parsed = filtersSchema.safeParse({
    query: request.nextUrl.searchParams.get('query') ?? '',
    county: request.nextUrl.searchParams.get('county') ?? '',
    city: request.nextUrl.searchParams.get('city') ?? '',
    type: request.nextUrl.searchParams.get('type') || undefined,
    page: request.nextUrl.searchParams.get('page') ?? 1,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const client = createPrivilegedSupabaseClient();
  if (!client) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  try {
    const campaign = await queryCampaignSummary(client);
    if (!campaign) {
      return NextResponse.json({
        campaign: null,
        schools: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
      });
    }
    const leaderboard = await queryLeaderboard(client, campaign.id, {
      ...parsed.data,
      type: parsed.data.type ?? null,
      pageSize: 20,
    });
    return NextResponse.json(
      { campaign: { id: campaign.id, name: campaign.name }, ...leaderboard },
      { headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=45' } },
    );
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
