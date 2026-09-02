// @vitest-environment node

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { validateCampaignSchool } from '@/features/submissions/repository';

const campaignId = '11111111-1111-4111-8111-111111111111';
const schoolId = '22222222-2222-4222-8222-222222222222';

function currentCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: campaignId,
    name: 'Current campaign',
    start_date: '2000-01-01',
    end_date: '2099-12-31',
    active: true,
    ...overrides,
  };
}

function activeSchool() {
  return { id: schoolId, name: 'School', city: 'Budapest', active: true };
}

function validationClient(fixtures: {
  campaign?: unknown;
  school?: unknown;
  participation?: unknown;
}) {
  const records: Record<string, unknown> = {
    campaigns: fixtures.campaign ?? null,
    schools: fixtures.school ?? null,
    campaign_schools: fixtures.participation ?? null,
  };
  return {
    from: vi.fn((table: string) => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        maybeSingle: vi.fn(async () => ({ data: records[table], error: null })),
      };
      return builder;
    }),
  } as unknown as SupabaseClient;
}

describe('validateCampaignSchool', () => {
  it('accepts an active school participating in a currently open campaign', async () => {
    const result = await validateCampaignSchool(
      validationClient({
        campaign: currentCampaign(),
        school: activeSchool(),
        participation: { school_id: schoolId, active: true },
      }),
      campaignId,
      schoolId,
    );
    expect(result).toEqual({ valid: true });
  });

  it('rejects an inactive campaign (filtered from the privileged query)', async () => {
    const result = await validateCampaignSchool(
      validationClient({ campaign: null }),
      campaignId,
      schoolId,
    );
    expect(result).toEqual({ valid: false, reason: 'campaign' });
  });

  it.each([
    ['not started', { start_date: '2099-01-01', end_date: '2099-12-31' }],
    ['ended', { start_date: '2000-01-01', end_date: '2000-12-31' }],
  ])('rejects a campaign that has %s', async (_label, dates) => {
    const result = await validateCampaignSchool(
      validationClient({ campaign: currentCampaign(dates) }),
      campaignId,
      schoolId,
    );
    expect(result).toEqual({ valid: false, reason: 'campaign' });
  });

  it('rejects an inactive or unknown school', async () => {
    const result = await validateCampaignSchool(
      validationClient({ campaign: currentCampaign(), school: null }),
      campaignId,
      schoolId,
    );
    expect(result).toEqual({ valid: false, reason: 'school' });
  });

  it('rejects a school without active campaign participation', async () => {
    const result = await validateCampaignSchool(
      validationClient({
        campaign: currentCampaign(),
        school: activeSchool(),
        participation: null,
      }),
      campaignId,
      schoolId,
    );
    expect(result).toEqual({ valid: false, reason: 'participation' });
  });
});
