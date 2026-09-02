import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';

import type {
  CampaignSummary,
  LeaderboardPage,
  LeaderboardSchool,
  PublishedNewsItem,
  PublicHomeData,
  SchoolProfile,
  SchoolSelection,
  SchoolType,
} from '@/features/public-data/types';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';

const schoolTypeSchema = z.enum([
  'kindergarten',
  'primary_school',
  'secondary_school',
  'vocational_school',
  'special_school',
  'other',
]);

const campaignSummaryRowSchema = z.object({
  campaign_id: z.uuid(),
  campaign_name: z.string(),
  campaign_slug: z.string(),
  target_amount: z.coerce.number().int().positive(),
  start_date: z.iso.date(),
  end_date: z.iso.date(),
  approved_amount: z.coerce.number().int().nonnegative(),
  approved_bottle_count: z.coerce.number().int().nonnegative(),
  participating_school_count: z.coerce.number().int().nonnegative(),
});

const leaderboardRowSchema = z.object({
  campaign_id: z.uuid(),
  school_id: z.uuid(),
  school_name: z.string(),
  school_slug: z.string(),
  school_type: schoolTypeSchema,
  city: z.string(),
  county: z.string(),
  approved_amount: z.coerce.number().int().nonnegative(),
  approved_bottle_count: z.coerce.number().int().nonnegative(),
  national_rank: z.coerce.number().int().positive(),
  total_count: z.coerce.number().int().nonnegative(),
});

const schoolSearchRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  type: schoolTypeSchema,
  city: z.string(),
  county: z.string(),
});

const schoolProfileRowSchema = z.object({
  school_id: z.uuid(),
  school_name: z.string(),
  school_slug: z.string(),
  school_type: schoolTypeSchema,
  city: z.string(),
  county: z.string(),
  campaign_id: z.uuid(),
  campaign_name: z.string(),
  approved_amount: z.coerce.number().int().nonnegative(),
  approved_bottle_count: z.coerce.number().int().nonnegative(),
  national_rank: z.coerce.number().int().positive().nullable(),
});

const newsRowSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  published_at: z.string(),
});

function mapLeaderboardRow(row: z.infer<typeof leaderboardRowSchema>): LeaderboardSchool {
  return {
    id: row.school_id,
    name: row.school_name,
    slug: row.school_slug,
    type: row.school_type,
    city: row.city,
    county: row.county,
    rank: row.national_rank,
    approvedAmount: row.approved_amount,
    approvedBottleCount: row.approved_bottle_count,
  };
}

export async function queryCampaignSummary(
  client: SupabaseClient,
): Promise<CampaignSummary | null> {
  const { data, error } = await client.rpc('public_campaign_summary', {
    requested_campaign_id: null,
  });
  if (error) throw error;
  const parsed = z.array(campaignSummaryRowSchema).safeParse(data);
  if (!parsed.success) throw new Error('Invalid public campaign summary response');
  const row = parsed.data[0];
  if (!row) return null;
  return {
    id: row.campaign_id,
    name: row.campaign_name,
    slug: row.campaign_slug,
    targetAmount: row.target_amount,
    startDate: row.start_date,
    endDate: row.end_date,
    approvedAmount: row.approved_amount,
    approvedBottleCount: row.approved_bottle_count,
    participatingSchoolCount: row.participating_school_count,
  };
}

export async function queryLeaderboard(
  client: SupabaseClient,
  campaignId: string,
  filters: {
    query?: string;
    county?: string;
    city?: string;
    type?: SchoolType | null;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<LeaderboardPage> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const { data, error } = await client.rpc('public_campaign_leaderboard', {
    requested_campaign_id: campaignId,
    requested_query: filters.query ?? '',
    requested_county: filters.county ?? '',
    requested_city: filters.city ?? '',
    requested_type: filters.type ?? null,
    requested_page: page,
    requested_page_size: pageSize,
  });
  if (error) throw error;
  const parsed = z.array(leaderboardRowSchema).safeParse(data);
  if (!parsed.success) throw new Error('Invalid public leaderboard response');
  return {
    schools: parsed.data.map(mapLeaderboardRow),
    totalCount: parsed.data[0]?.total_count ?? 0,
    page,
    pageSize,
  };
}

export async function queryPublishedNews(
  client: SupabaseClient,
  limit = 3,
): Promise<PublishedNewsItem[]> {
  const { data, error } = await client
    .from('news')
    .select('id, title, slug, excerpt, content, published_at')
    .eq('published', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 10));
  if (error) throw error;
  const parsed = z.array(newsRowSchema).safeParse(data);
  if (!parsed.success) throw new Error('Invalid published news response');
  return parsed.data.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    publishedAt: row.published_at,
  }));
}

export async function queryPublishedNewsBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<PublishedNewsItem | null> {
  const { data, error } = await client
    .from('news')
    .select('id, title, slug, excerpt, content, published_at')
    .eq('slug', slug)
    .eq('published', true)
    .lte('published_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  const parsed = newsRowSchema.safeParse(data);
  if (!parsed.success) return null;
  return {
    id: parsed.data.id,
    title: parsed.data.title,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    publishedAt: parsed.data.published_at,
  };
}

export async function querySchoolSearch(
  client: SupabaseClient,
  values: { query: string; campaignId?: string; schoolId?: string; limit?: number },
): Promise<SchoolSelection[]> {
  const { data, error } = await client.rpc('search_schools', {
    requested_query: values.query,
    requested_campaign_id: values.campaignId ?? null,
    requested_limit: values.limit ?? 15,
    requested_school_id: values.schoolId ?? null,
  });
  if (error) throw error;
  const parsed = z.array(schoolSearchRowSchema).safeParse(data);
  if (!parsed.success) throw new Error('Invalid school search response');
  return parsed.data.map(({ id, name, city, county }) => ({ id, name, city, county }));
}

export async function querySchoolProfile(
  client: SupabaseClient,
  slug: string,
): Promise<SchoolProfile | null> {
  const { data, error } = await client.rpc('public_school_profile', {
    requested_slug: slug,
    requested_campaign_id: null,
  });
  if (error) throw error;
  const parsed = z.array(schoolProfileRowSchema).safeParse(data);
  if (!parsed.success) throw new Error('Invalid public school profile response');
  const row = parsed.data[0];
  if (!row) return null;
  return {
    id: row.school_id,
    name: row.school_name,
    slug: row.school_slug,
    type: row.school_type,
    city: row.city,
    county: row.county,
    rank: row.national_rank ?? 0,
    approvedAmount: row.approved_amount,
    approvedBottleCount: row.approved_bottle_count,
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
  };
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const client = createPrivilegedSupabaseClient();
  if (!client) return { available: false, campaign: null, leaderboard: [], news: [] };
  try {
    const campaign = await queryCampaignSummary(client);
    const [leaderboard, news] = await Promise.all([
      campaign
        ? queryLeaderboard(client, campaign.id, { page: 1, pageSize: 7 })
        : Promise.resolve({ schools: [], totalCount: 0, page: 1, pageSize: 7 }),
      queryPublishedNews(client),
    ]);
    return { available: true, campaign, leaderboard: leaderboard.schools, news };
  } catch {
    return { available: false, campaign: null, leaderboard: [], news: [] };
  }
}

export const getCachedPublicHomeData = unstable_cache(getPublicHomeData, ['public-home-v1'], {
  revalidate: 60,
  tags: ['public-campaign', 'public-news'],
});

export function getCachedSchoolProfile(slug: string) {
  return unstable_cache(
    async () => {
      const client = createPrivilegedSupabaseClient();
      if (!client) return null;
      try {
        return await querySchoolProfile(client, slug);
      } catch {
        return null;
      }
    },
    ['public-school-profile-v1', slug],
    { revalidate: 60, tags: ['public-campaign', `public-school:${slug}`] },
  )();
}

export function getCachedPublishedNewsBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const client = createPrivilegedSupabaseClient();
      if (!client) return null;
      try {
        return await queryPublishedNewsBySlug(client, slug);
      } catch {
        return null;
      }
    },
    ['public-news-article-v1', slug],
    { revalidate: 60, tags: ['public-news'] },
  )();
}

export function getPublicClient() {
  return createPrivilegedSupabaseClient();
}
