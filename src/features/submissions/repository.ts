import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { RECEIPT_BUCKET } from '@/features/submissions/constants';
import type { NormalizedReceiptImage } from '@/features/submissions/image';

const campaignSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  start_date: z.iso.date(),
  end_date: z.iso.date(),
  active: z.boolean(),
});

const schoolSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  city: z.string(),
  active: z.boolean(),
});

const participationSchema = z.object({
  school_id: z.uuid(),
  active: z.boolean(),
});

const existingSubmissionSchema = z.object({
  public_reference: z.uuid(),
});

export interface PublicSubmissionOptions {
  campaign: {
    id: string;
    name: string;
  };
  schools: Array<{
    id: string;
    name: string;
    city: string;
  }>;
}

export type CampaignSchoolValidation =
  { valid: true } | { valid: false; reason: 'campaign' | 'school' | 'participation' };

export class SubmissionRepositoryError extends Error {
  constructor(
    public readonly operation: 'query' | 'upload' | 'insert' | 'cleanup',
    public readonly databaseCode?: string,
  ) {
    super(operation);
    this.name = 'SubmissionRepositoryError';
  }
}

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getPublicSubmissionOptions(
  client: SupabaseClient,
): Promise<PublicSubmissionOptions | null> {
  const { data: campaignData, error: campaignError } = await client
    .from('campaigns')
    .select('id, name, start_date, end_date, active')
    .eq('active', true)
    .maybeSingle();

  if (campaignError) {
    throw new SubmissionRepositoryError('query', campaignError.code);
  }

  const campaign = campaignSchema.safeParse(campaignData);
  const today = currentIsoDate();
  if (
    !campaign.success ||
    !campaign.data.active ||
    campaign.data.start_date > today ||
    campaign.data.end_date < today
  ) {
    return null;
  }

  const { data: participationData, error: participationError } = await client
    .from('campaign_schools')
    .select('school_id, active')
    .eq('campaign_id', campaign.data.id)
    .eq('active', true);

  if (participationError) {
    throw new SubmissionRepositoryError('query', participationError.code);
  }

  const participations = z.array(participationSchema).safeParse(participationData);
  if (!participations.success || participations.data.length === 0) {
    return { campaign: { id: campaign.data.id, name: campaign.data.name }, schools: [] };
  }

  const { data: schoolData, error: schoolError } = await client
    .from('schools')
    .select('id, name, city, active')
    .in(
      'id',
      participations.data.map(({ school_id }) => school_id),
    )
    .eq('active', true)
    .order('name', { ascending: true });

  if (schoolError) {
    throw new SubmissionRepositoryError('query', schoolError.code);
  }

  const schools = z.array(schoolSchema).safeParse(schoolData);
  if (!schools.success) {
    throw new SubmissionRepositoryError('query');
  }

  return {
    campaign: { id: campaign.data.id, name: campaign.data.name },
    schools: schools.data.map(({ id, name, city }) => ({ id, name, city })),
  };
}

export async function validateCampaignSchool(
  client: SupabaseClient,
  campaignId: string,
  schoolId: string,
): Promise<CampaignSchoolValidation> {
  const { data: campaignData, error: campaignError } = await client
    .from('campaigns')
    .select('id, name, start_date, end_date, active')
    .eq('id', campaignId)
    .eq('active', true)
    .maybeSingle();

  if (campaignError) throw new SubmissionRepositoryError('query', campaignError.code);

  const campaign = campaignSchema.safeParse(campaignData);
  const today = currentIsoDate();
  if (!campaign.success || campaign.data.start_date > today || campaign.data.end_date < today) {
    return { valid: false, reason: 'campaign' };
  }

  const { data: schoolData, error: schoolError } = await client
    .from('schools')
    .select('id, name, city, active')
    .eq('id', schoolId)
    .eq('active', true)
    .maybeSingle();

  if (schoolError) throw new SubmissionRepositoryError('query', schoolError.code);
  if (!schoolSchema.safeParse(schoolData).success) {
    return { valid: false, reason: 'school' };
  }

  const { data: participationData, error: participationError } = await client
    .from('campaign_schools')
    .select('school_id, active')
    .eq('campaign_id', campaignId)
    .eq('school_id', schoolId)
    .eq('active', true)
    .maybeSingle();

  if (participationError) {
    throw new SubmissionRepositoryError('query', participationError.code);
  }

  return participationSchema.safeParse(participationData).success
    ? { valid: true }
    : { valid: false, reason: 'participation' };
}

export async function findSubmissionByIdempotencyKey(
  client: SupabaseClient,
  idempotencyKeyHash: string,
) {
  const { data, error } = await client
    .from('submissions')
    .select('public_reference')
    .eq('idempotency_key_hash', idempotencyKeyHash)
    .maybeSingle();

  if (error) throw new SubmissionRepositoryError('query', error.code);
  const parsed = existingSubmissionSchema.safeParse(data);
  return parsed.success ? parsed.data.public_reference : null;
}

export async function uploadReceiptImage(
  client: SupabaseClient,
  path: string,
  image: NormalizedReceiptImage,
) {
  const { error } = await client.storage.from(RECEIPT_BUCKET).upload(path, image.buffer, {
    cacheControl: '0',
    contentType: image.contentType,
    upsert: false,
  });

  if (error) throw new SubmissionRepositoryError('upload');
}

export async function insertPendingSubmission(
  client: SupabaseClient,
  values: {
    id: string;
    publicReference: string;
    campaignId: string;
    schoolId: string;
    path: string;
    sha256: string;
    idempotencyKeyHash: string;
  },
) {
  const { data, error } = await client
    .from('submissions')
    .insert({
      id: values.id,
      public_reference: values.publicReference,
      campaign_id: values.campaignId,
      school_id: values.schoolId,
      receipt_image_path: values.path,
      receipt_image_sha256: values.sha256,
      idempotency_key_hash: values.idempotencyKeyHash,
      status: 'pending',
      ocr_status: 'not_requested',
      approved_amount: null,
      approved_bottle_count: null,
      detected_amount: null,
      detected_bottle_count: null,
    })
    .select('public_reference')
    .single();

  if (error) throw new SubmissionRepositoryError('insert', error.code);
  const parsed = existingSubmissionSchema.safeParse(data);
  if (!parsed.success) throw new SubmissionRepositoryError('insert');
  return parsed.data.public_reference;
}

export async function removeReceiptImage(client: SupabaseClient, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await client.storage.from(RECEIPT_BUCKET).remove([path]);
    if (!error) return;
  }

  throw new SubmissionRepositoryError('cleanup');
}
