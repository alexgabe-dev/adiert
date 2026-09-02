// @vitest-environment node

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({
  unstable_cache: (callback: unknown) => callback,
}));

import {
  queryCampaignSummary,
  queryLeaderboard,
  querySchoolProfile,
  querySchoolSearch,
} from '@/features/public-data/repository';

function rpcClient(data: unknown): SupabaseClient {
  return {
    rpc: vi.fn(async () => ({ data, error: null })),
  } as unknown as SupabaseClient;
}

describe('public data repository boundaries', () => {
  it('maps approved campaign summary fields without deriving money from bottles', async () => {
    const summary = await queryCampaignSummary(
      rpcClient([
        {
          campaign_id: '11111111-1111-4111-8111-111111111111',
          campaign_name: 'Kampány',
          campaign_slug: 'kampany',
          target_amount: 100000,
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          approved_amount: 1234,
          approved_bottle_count: 99,
          participating_school_count: 3,
        },
      ]),
    );
    expect(summary?.approvedAmount).toBe(1234);
    expect(summary?.approvedBottleCount).toBe(99);
  });

  it('maps deterministic leaderboard ranks and pagination metadata', async () => {
    const page = await queryLeaderboard(
      rpcClient([
        {
          campaign_id: '11111111-1111-4111-8111-111111111111',
          school_id: '22222222-2222-4222-8222-222222222222',
          school_name: 'Árvíztűrő Iskola',
          school_slug: 'arvizturo-iskola',
          school_type: 'other',
          city: 'Őriszentpéter',
          county: 'Vas',
          approved_amount: 5000,
          approved_bottle_count: 80,
          national_rank: 1,
          total_count: 42,
        },
      ]),
      '11111111-1111-4111-8111-111111111111',
      { page: 2, pageSize: 20 },
    );
    expect(page.totalCount).toBe(42);
    expect(page.schools[0]).toMatchObject({ rank: 1, approvedAmount: 5000 });
    expect(page.schools[0]).not.toHaveProperty('previousRank');
  });

  it('exposes only safe school search fields', async () => {
    const schools = await querySchoolSearch(
      rpcClient([
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Iskola',
          slug: 'iskola',
          type: 'other',
          city: 'Város',
          county: 'Vármegye',
        },
      ]),
      { query: 'iskola' },
    );
    expect(schools).toEqual([
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Iskola',
        city: 'Város',
        county: 'Vármegye',
      },
    ]);
  });

  it('maps a zero-total participating school profile without private receipt data', async () => {
    const profile = await querySchoolProfile(
      rpcClient([
        {
          school_id: '22222222-2222-4222-8222-222222222222',
          school_name: 'Iskola',
          school_slug: 'iskola',
          school_type: 'other',
          city: 'Város',
          county: 'Vármegye',
          campaign_id: '11111111-1111-4111-8111-111111111111',
          campaign_name: 'Kampány',
          approved_amount: 0,
          approved_bottle_count: 0,
          national_rank: null,
        },
      ]),
      'iskola',
    );
    expect(profile).toMatchObject({ rank: 0, approvedAmount: 0, approvedBottleCount: 0 });
    expect(JSON.stringify(profile)).not.toMatch(/receipt|identifier|detected|reviewer/i);
  });
});
