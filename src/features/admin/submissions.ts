import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const submissionStatuses = ['pending', 'needs_review', 'approved', 'rejected'] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

const submissionListRowSchema = z.object({
  id: z.uuid(),
  public_reference: z.uuid(),
  school_id: z.uuid(),
  campaign_id: z.uuid(),
  status: z.enum(submissionStatuses),
  fraud_score: z.coerce.number().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  version: z.number().int().positive(),
});

const schoolSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  city: z.string(),
});

const campaignSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const submissionDetailSchema = z.object({
  id: z.uuid(),
  public_reference: z.uuid(),
  school_id: z.uuid(),
  campaign_id: z.uuid(),
  status: z.enum(submissionStatuses),
  detected_amount: z.coerce.number().nullable(),
  detected_bottle_count: z.number().int().nullable(),
  detected_receipt_identifier: z.string().nullable(),
  detected_receipt_date: z.string().nullable(),
  approved_amount: z.coerce.number().nullable(),
  approved_bottle_count: z.number().int().nullable(),
  receipt_identifier: z.string().nullable(),
  receipt_date: z.string().nullable(),
  rejection_reason: z.string().nullable(),
  fraud_score: z.coerce.number().nullable(),
  ocr_status: z.string(),
  created_at: z.iso.datetime({ offset: true }),
  reviewed_at: z.iso.datetime({ offset: true }).nullable(),
  reviewed_by: z.uuid().nullable(),
  version: z.number().int().positive(),
});

const flagSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  severity: z.number().int(),
  score: z.coerce.number(),
  details: z.unknown(),
  resolved_at: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

const reviewSchema = z.object({
  id: z.uuid(),
  reviewer_id: z.uuid(),
  from_status: z.enum(submissionStatuses),
  to_status: z.enum(submissionStatuses),
  approved_amount: z.coerce.number().nullable(),
  approved_bottle_count: z.number().int().nullable(),
  reason: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

export interface AdminSubmissionListItem {
  id: string;
  publicReference: string;
  schoolName: string;
  schoolCity: string;
  campaignName: string;
  status: SubmissionStatus;
  fraudScore: number | null;
  createdAt: string;
  version: number;
}

export interface AdminSubmissionDetail extends AdminSubmissionListItem {
  detectedAmount: number | null;
  detectedBottleCount: number | null;
  detectedReceiptIdentifier: string | null;
  detectedReceiptDate: string | null;
  approvedAmount: number | null;
  approvedBottleCount: number | null;
  receiptIdentifier: string | null;
  receiptDate: string | null;
  rejectionReason: string | null;
  ocrStatus: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  flags: z.infer<typeof flagSchema>[];
  reviews: z.infer<typeof reviewSchema>[];
}

export class AdminSubmissionQueryError extends Error {
  constructor() {
    super('admin_submission_query_failed');
    this.name = 'AdminSubmissionQueryError';
  }
}

async function loadSchools(client: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return new Map<string, z.infer<typeof schoolSchema>>();
  const { data, error } = await client.from('schools').select('id, name, city').in('id', ids);
  const parsed = z.array(schoolSchema).safeParse(data);
  if (error || !parsed.success) throw new AdminSubmissionQueryError();
  return new Map(parsed.data.map((school) => [school.id, school]));
}

async function loadCampaigns(client: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return new Map<string, z.infer<typeof campaignSchema>>();
  const { data, error } = await client.from('campaigns').select('id, name').in('id', ids);
  const parsed = z.array(campaignSchema).safeParse(data);
  if (error || !parsed.success) throw new AdminSubmissionQueryError();
  return new Map(parsed.data.map((campaign) => [campaign.id, campaign]));
}

async function findSchoolIds(client: SupabaseClient, search: string) {
  if (!search) return null;
  const escapedSearch = search
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
  const { data, error } = await client
    .from('schools')
    .select('id')
    .ilike('name', `%${escapedSearch}%`)
    .limit(100);
  const parsed = z.array(z.object({ id: z.uuid() })).safeParse(data);
  if (error || !parsed.success) throw new AdminSubmissionQueryError();
  return parsed.data.map(({ id }) => id);
}

export async function listAdminSubmissions(
  client: SupabaseClient,
  input: { status: SubmissionStatus | 'all'; schoolSearch: string; page: number; pageSize: number },
) {
  const schoolIds = await findSchoolIds(client, input.schoolSearch);
  if (schoolIds?.length === 0) return { items: [], total: 0 };

  let query = client
    .from('submissions')
    .select(
      'id, public_reference, school_id, campaign_id, status, fraud_score, created_at, version',
      { count: 'exact' },
    );
  if (input.status !== 'all') query = query.eq('status', input.status);
  if (schoolIds) query = query.in('school_id', schoolIds);

  const offset = (input.page - 1) * input.pageSize;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + input.pageSize - 1);
  const rows = z.array(submissionListRowSchema).safeParse(data);
  if (error || !rows.success) throw new AdminSubmissionQueryError();

  const schools = await loadSchools(client, [...new Set(rows.data.map((row) => row.school_id))]);
  const campaigns = await loadCampaigns(client, [
    ...new Set(rows.data.map((row) => row.campaign_id)),
  ]);

  const items: AdminSubmissionListItem[] = rows.data.map((row) => ({
    id: row.id,
    publicReference: row.public_reference,
    schoolName: schools.get(row.school_id)?.name ?? 'Ismeretlen iskola',
    schoolCity: schools.get(row.school_id)?.city ?? '',
    campaignName: campaigns.get(row.campaign_id)?.name ?? 'Ismeretlen kampány',
    status: row.status,
    fraudScore: row.fraud_score,
    createdAt: row.created_at,
    version: row.version,
  }));

  return { items, total: count ?? 0 };
}

export async function getAdminSubmission(
  client: SupabaseClient,
  submissionId: string,
): Promise<AdminSubmissionDetail | null> {
  const { data, error } = await client
    .from('submissions')
    .select(
      'id, public_reference, school_id, campaign_id, status, detected_amount, detected_bottle_count, detected_receipt_identifier, detected_receipt_date, approved_amount, approved_bottle_count, receipt_identifier, receipt_date, rejection_reason, fraud_score, ocr_status, created_at, reviewed_at, reviewed_by, version',
    )
    .eq('id', submissionId)
    .maybeSingle();
  if (error) throw new AdminSubmissionQueryError();
  if (!data) return null;
  const submission = submissionDetailSchema.safeParse(data);
  if (!submission.success) throw new AdminSubmissionQueryError();

  const [schools, campaigns, flagResult, reviewResult] = await Promise.all([
    loadSchools(client, [submission.data.school_id]),
    loadCampaigns(client, [submission.data.campaign_id]),
    client
      .from('submission_flags')
      .select('id, type, severity, score, details, resolved_at, created_at')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false }),
    client
      .from('submission_reviews')
      .select(
        'id, reviewer_id, from_status, to_status, approved_amount, approved_bottle_count, reason, created_at',
      )
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false }),
  ]);

  const flags = z.array(flagSchema).safeParse(flagResult.data);
  const reviews = z.array(reviewSchema).safeParse(reviewResult.data);
  if (flagResult.error || reviewResult.error || !flags.success || !reviews.success) {
    throw new AdminSubmissionQueryError();
  }

  const row = submission.data;
  return {
    id: row.id,
    publicReference: row.public_reference,
    schoolName: schools.get(row.school_id)?.name ?? 'Ismeretlen iskola',
    schoolCity: schools.get(row.school_id)?.city ?? '',
    campaignName: campaigns.get(row.campaign_id)?.name ?? 'Ismeretlen kampány',
    status: row.status,
    fraudScore: row.fraud_score,
    createdAt: row.created_at,
    version: row.version,
    detectedAmount: row.detected_amount,
    detectedBottleCount: row.detected_bottle_count,
    detectedReceiptIdentifier: row.detected_receipt_identifier,
    detectedReceiptDate: row.detected_receipt_date,
    approvedAmount: row.approved_amount,
    approvedBottleCount: row.approved_bottle_count,
    receiptIdentifier: row.receipt_identifier,
    receiptDate: row.receipt_date,
    rejectionReason: row.rejection_reason,
    ocrStatus: row.ocr_status,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    flags: flags.data,
    reviews: reviews.data,
  };
}

export async function getReceiptPathForReview(client: SupabaseClient, submissionId: string) {
  const { data, error } = await client
    .from('submissions')
    .select('receipt_image_path')
    .eq('id', submissionId)
    .maybeSingle();
  const parsed = z.object({ receipt_image_path: z.string().min(1) }).safeParse(data);
  if (error) throw new AdminSubmissionQueryError();
  return parsed.success ? parsed.data.receipt_image_path : null;
}
