// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({
  querySchoolSearch: vi.fn(),
  createPrivilegedSupabaseClient: vi.fn(() => ({ kind: 'server-only-client' })),
}));

vi.mock('@/features/public-data/repository', () => ({
  querySchoolSearch: dependencies.querySchoolSearch,
}));
vi.mock('@/lib/supabase/admin', () => ({
  createPrivilegedSupabaseClient: dependencies.createPrivilegedSupabaseClient,
}));

import { GET } from '@/app/api/schools/search/route';

const campaignId = '11111111-1111-4111-8111-111111111111';

describe('GET /api/schools/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.querySchoolSearch.mockResolvedValue([]);
  });

  it('rejects an unbounded one-character query before database access', async () => {
    const response = await GET(
      new NextRequest(`http://localhost/api/schools/search?query=a&campaign_id=${campaignId}`),
    );
    expect(response.status).toBe(400);
    expect(dependencies.querySchoolSearch).not.toHaveBeenCalled();
  });

  it('passes a bounded campaign-scoped query and returns only safe results', async () => {
    dependencies.querySchoolSearch.mockResolvedValue([
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Árvíztűrő Iskola',
        city: 'Őriszentpéter',
        county: 'Vas',
      },
    ]);
    const response = await GET(
      new NextRequest(
        `http://localhost/api/schools/search?query=arvizturo&campaign_id=${campaignId}`,
      ),
    );
    expect(response.status).toBe(200);
    expect(dependencies.querySchoolSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ query: 'arvizturo', campaignId, limit: 15 }),
    );
    const body = await response.json();
    expect(body.results[0]).toEqual({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Árvíztűrő Iskola',
      city: 'Őriszentpéter',
      county: 'Vas',
    });
    expect(JSON.stringify(body)).not.toMatch(/email|phone|receipt/i);
  });
});
