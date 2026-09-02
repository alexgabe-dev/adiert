import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { administratorRoles } from '@/lib/auth/roles';

export const schoolTypes = [
  'kindergarten',
  'primary_school',
  'secondary_school',
  'vocational_school',
  'special_school',
  'other',
] as const;

export type SchoolType = (typeof schoolTypes)[number];

const campaignSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  target_amount: z.coerce.number().int().positive(),
  start_date: z.iso.date(),
  end_date: z.iso.date(),
  active: z.boolean(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});

const schoolRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(schoolTypes),
  city: z.string(),
  county: z.string(),
  postal_code: z.string().nullable(),
  address: z.string().nullable(),
  active: z.boolean(),
  campaign_count: z.coerce.number().int().nonnegative(),
  participating: z.boolean(),
  total_count: z.coerce.number().int().nonnegative(),
});

const newsSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  published: z.boolean(),
  published_at: z.iso.datetime({ offset: true }).nullable(),
  updated_at: z.iso.datetime({ offset: true }),
});

const administratorSchema = z.object({
  user_id: z.uuid(),
  role: z.enum(administratorRoles),
  active: z.boolean(),
  display_name: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});

const auditSchema = z.object({
  id: z.uuid(),
  actor_user_id: z.uuid(),
  action: z.string(),
  target_type: z.string(),
  target_id: z.uuid().nullable(),
  target_label: z.string(),
  result: z.enum(['success', 'failure']),
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.iso.datetime({ offset: true }),
});

const recentReviewSchema = z.object({
  id: z.uuid(),
  submission_id: z.uuid(),
  reviewer_id: z.uuid(),
  from_status: z.enum(['pending', 'needs_review', 'approved', 'rejected']),
  to_status: z.enum(['pending', 'needs_review', 'approved', 'rejected']),
  created_at: z.iso.datetime({ offset: true }),
});

export type AdminCampaign = z.infer<typeof campaignSchema> & { participatingSchoolCount: number };
export type AdminSchool = z.infer<typeof schoolRowSchema>;
export type AdminNewsItem = z.infer<typeof newsSchema>;
export type AdminAdministrator = z.infer<typeof administratorSchema> & { email: string | null };
export type AdminAuditItem = z.infer<typeof auditSchema>;
export type AdminRecentReview = z.infer<typeof recentReviewSchema>;

export class AdminControlQueryError extends Error {
  constructor() {
    super('admin_control_query_failed');
    this.name = 'AdminControlQueryError';
  }
}

export async function listCampaigns(client: SupabaseClient): Promise<AdminCampaign[]> {
  const { data, error } = await client
    .from('campaigns')
    .select(
      'id, name, slug, description, target_amount, start_date, end_date, active, created_at, updated_at',
    )
    .order('created_at', { ascending: false });
  const campaigns = z.array(campaignSchema).safeParse(data);
  if (error || !campaigns.success) throw new AdminControlQueryError();

  const ids = campaigns.data.map(({ id }) => id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: participations, error: participationError } = await client
      .from('campaign_schools')
      .select('campaign_id')
      .in('campaign_id', ids)
      .eq('active', true);
    const parsed = z.array(z.object({ campaign_id: z.uuid() })).safeParse(participations);
    if (participationError || !parsed.success) throw new AdminControlQueryError();
    for (const row of parsed.data)
      counts.set(row.campaign_id, (counts.get(row.campaign_id) ?? 0) + 1);
  }
  return campaigns.data.map((campaign) => ({
    ...campaign,
    participatingSchoolCount: counts.get(campaign.id) ?? 0,
  }));
}

export async function getCampaign(client: SupabaseClient, id: string) {
  return (await listCampaigns(client)).find((campaign) => campaign.id === id) ?? null;
}

export async function listSchools(
  client: SupabaseClient,
  input: {
    query?: string;
    county?: string;
    city?: string;
    active?: boolean | null;
    campaignId?: string | null;
    participation?: 'all' | 'selected' | 'unselected';
    page?: number;
    pageSize?: number;
  },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const { data, error } = await client.rpc('admin_list_schools', {
    requested_query: input.query ?? '',
    requested_county: input.county ?? '',
    requested_city: input.city ?? '',
    requested_active: input.active ?? null,
    requested_campaign_id: input.campaignId ?? null,
    requested_participation: input.participation ?? 'all',
    requested_page: page,
    requested_page_size: pageSize,
  });
  const parsed = z.array(schoolRowSchema).safeParse(data);
  if (error || !parsed.success) throw new AdminControlQueryError();
  return { items: parsed.data, total: parsed.data[0]?.total_count ?? 0, page, pageSize };
}

export async function getSchool(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from('schools')
    .select('id, name, slug, type, city, county, postal_code, address, active')
    .eq('id', id)
    .maybeSingle();
  const parsed = schoolRowSchema
    .omit({ campaign_count: true, participating: true, total_count: true })
    .safeParse(data);
  if (error) throw new AdminControlQueryError();
  return parsed.success ? parsed.data : null;
}

export async function listNews(client: SupabaseClient): Promise<AdminNewsItem[]> {
  const { data, error } = await client
    .from('news')
    .select('id, title, slug, excerpt, content, published, published_at, updated_at')
    .order('updated_at', { ascending: false });
  const parsed = z.array(newsSchema).safeParse(data);
  if (error || !parsed.success) throw new AdminControlQueryError();
  return parsed.data;
}

export async function getNews(client: SupabaseClient, id: string) {
  return (await listNews(client)).find((item) => item.id === id) ?? null;
}

export async function listAdministrators(
  client: SupabaseClient,
  privilegedClient: SupabaseClient | null,
): Promise<AdminAdministrator[]> {
  const { data, error } = await client
    .from('administrators')
    .select('user_id, role, active, display_name, created_at, updated_at')
    .order('created_at');
  const parsed = z.array(administratorSchema).safeParse(data);
  if (error || !parsed.success) throw new AdminControlQueryError();
  if (!privilegedClient)
    return parsed.data.map((administrator) => ({ ...administrator, email: null }));

  return Promise.all(
    parsed.data.map(async (administrator) => {
      const { data: userData, error: userError } = await privilegedClient.auth.admin.getUserById(
        administrator.user_id,
      );
      return {
        ...administrator,
        email: userError ? null : (userData.user?.email ?? null),
      };
    }),
  );
}

export async function listAudit(client: SupabaseClient, page = 1, pageSize = 30) {
  const offset = (page - 1) * pageSize;
  const { data, error, count } = await client
    .from('admin_audit_log')
    .select(
      'id, actor_user_id, action, target_type, target_id, target_label, result, metadata, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  const parsed = z.array(auditSchema).safeParse(data);
  if (error || !parsed.success) throw new AdminControlQueryError();
  return { items: parsed.data, total: count ?? 0, page, pageSize };
}

export async function listRecentReviews(client: SupabaseClient, limit = 5) {
  const { data, error } = await client
    .from('submission_reviews')
    .select('id, submission_id, reviewer_id, from_status, to_status, created_at')
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 10)));
  const parsed = z.array(recentReviewSchema).safeParse(data);
  if (error || !parsed.success) throw new AdminControlQueryError();
  return parsed.data;
}
