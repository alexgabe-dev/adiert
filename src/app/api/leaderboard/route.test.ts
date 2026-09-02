// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({
  queryCampaignSummary: vi.fn(),
  queryLeaderboard: vi.fn(),
  createPrivilegedSupabaseClient: vi.fn(() => ({ kind: 'server-only-client' })),
}));

vi.mock('@/features/public-data/repository', () => ({
  queryCampaignSummary: dependencies.queryCampaignSummary,
  queryLeaderboard: dependencies.queryLeaderboard,
}));
vi.mock('@/lib/supabase/admin', () => ({
  createPrivilegedSupabaseClient: dependencies.createPrivilegedSupabaseClient,
}));

import { GET } from '@/app/api/leaderboard/route';

describe('GET /api/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.queryCampaignSummary.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Kampány',
    });
    dependencies.queryLeaderboard.mockResolvedValue({
      schools: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    });
  });

  it('passes normalized server-side pagination and filters to the repository', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/leaderboard?query=iskola&county=Vas&city=Szombathely&page=2',
      ),
    );
    expect(response.status).toBe(200);
    expect(dependencies.queryLeaderboard).toHaveBeenCalledWith(
      expect.anything(),
      '11111111-1111-4111-8111-111111111111',
      expect.objectContaining({
        query: 'iskola',
        county: 'Vas',
        city: 'Szombathely',
        page: 2,
        pageSize: 20,
      }),
    );
  });

  it('returns a truthful empty state when there is no active campaign', async () => {
    dependencies.queryCampaignSummary.mockResolvedValue(null);
    const response = await GET(new NextRequest('http://localhost/api/leaderboard'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      campaign: null,
      schools: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    });
    expect(dependencies.queryLeaderboard).not.toHaveBeenCalled();
  });
});
