'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { schoolTypes } from '@/features/admin/control-center';
import { environment } from '@/lib/env';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { administratorRoles } from '@/lib/auth/roles';
import { hasValidMutationOrigin } from '@/lib/security/origin';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const uuidOrNull = z.preprocess((value) => (value === '' ? null : value), z.uuid().nullable());
const slug = z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const campaignSchema = z.object({
  id: uuidOrNull,
  name: z.string().trim().min(2).max(160),
  slug,
  description: z.string().trim().max(5000),
  targetAmount: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
}).refine((value) => value.endDate >= value.startDate, { path: ['endDate'] });

function redirectWith(path: string, key: 'success' | 'error', message: string): never {
  const separator = path.includes('?') ? '&' : '?';
  redirect(`${path}${separator}${key}=${encodeURIComponent(message)}`);
}

async function mutationClient(requiredRole: 'admin' | 'super_admin') {
  if (!(await hasValidMutationOrigin())) return null;
  await requireAdministratorRole(requiredRole);
  return createServerSupabaseClient();
}

export async function saveCampaignAction(formData: FormData) {
  const client = await mutationClient('admin');
  if (!client) redirectWith('/admin/kampanyok', 'error', 'Érvénytelen vagy nem elérhető kérés.');
  const parsed = campaignSchema.safeParse({
    id: formData.get('campaign_id'), name: formData.get('name'), slug: formData.get('slug'),
    description: formData.get('description'), targetAmount: formData.get('target_amount'),
    startDate: formData.get('start_date'), endDate: formData.get('end_date'),
  });
  const fallback = parsed.success && parsed.data.id ? `/admin/kampanyok/${parsed.data.id}` : '/admin/kampanyok';
  if (!parsed.success) redirectWith(fallback, 'error', 'Ellenőrizd a kampány adatait és dátumait.');
  const { data, error } = await client.rpc('admin_save_campaign', {
    requested_campaign_id: parsed.data.id,
    requested_name: parsed.data.name,
    requested_slug: parsed.data.slug,
    requested_description: parsed.data.description,
    requested_target_amount: parsed.data.targetAmount,
    requested_start_date: parsed.data.startDate,
    requested_end_date: parsed.data.endDate,
  });
  const id = z.uuid().safeParse(data);
  if (error || !id.success) redirectWith(fallback, 'error', error?.code === '23505' ? 'Ez a slug már használatban van.' : 'A kampány nem menthető.');
  revalidatePath('/admin'); revalidatePath('/admin/kampanyok'); revalidatePath(`/admin/kampanyok/${id.data}`);
  redirectWith(`/admin/kampanyok/${id.data}`, 'success', 'A kampány mentése sikerült.');
}

export async function setCampaignActiveAction(formData: FormData) {
  const id = z.uuid().safeParse(formData.get('campaign_id'));
  const active = z.enum(['true', 'false']).safeParse(formData.get('active'));
  const path = id.success ? `/admin/kampanyok/${id.data}` : '/admin/kampanyok';
  const client = await mutationClient('admin');
  if (!client || !id.success || !active.success) redirectWith(path, 'error', 'Érvénytelen kérés.');
  const { error } = await client.rpc('admin_set_campaign_active', {
    requested_campaign_id: id.data, requested_active: active.data === 'true',
  });
  if (error) redirectWith(path, 'error', error.code === '23505' ? 'Már van aktív kampány. Előbb deaktiváld azt.' : 'A kampány állapota nem módosítható.');
  revalidateTag('public-campaign', 'max'); revalidatePath('/'); revalidatePath('/admin'); revalidatePath('/admin/kampanyok'); revalidatePath(path);
  redirectWith(path, 'success', active.data === 'true' ? 'A kampány aktív.' : 'A kampány deaktiválva lett.');
}

export async function setCampaignSchoolAction(formData: FormData) {
  const campaignId = z.uuid().safeParse(formData.get('campaign_id'));
  const schoolId = z.uuid().safeParse(formData.get('school_id'));
  const active = z.enum(['true', 'false']).safeParse(formData.get('active'));
  const path = campaignId.success ? `/admin/kampanyok/${campaignId.data}` : '/admin/kampanyok';
  const client = await mutationClient('admin');
  if (!client || !campaignId.success || !schoolId.success || !active.success) redirectWith(path, 'error', 'Érvénytelen kérés.');
  const { error } = await client.rpc('admin_set_campaign_school', {
    requested_campaign_id: campaignId.data, requested_school_id: schoolId.data,
    requested_active: active.data === 'true',
  });
  if (error) redirectWith(path, 'error', 'A részvétel nem módosítható.');
  revalidateTag('public-campaign', 'max'); revalidatePath(path); revalidatePath('/admin');
  redirectWith(path, 'success', active.data === 'true' ? 'Az iskola hozzáadva.' : 'Az iskola részvétele deaktiválva.');
}

export async function bulkCampaignSchoolsAction(formData: FormData) {
  const schema = z.object({
    campaignId: z.uuid(), query: z.string().trim().max(120), county: z.string().trim().max(80),
    city: z.string().trim().max(80), participation: z.enum(['all', 'selected', 'unselected']),
    active: z.enum(['true', 'false']),
  });
  const parsed = schema.safeParse({ campaignId: formData.get('campaign_id'), query: formData.get('query') ?? '',
    county: formData.get('county') ?? '', city: formData.get('city') ?? '',
    participation: formData.get('participation') ?? 'all', active: formData.get('active') });
  const path = parsed.success ? `/admin/kampanyok/${parsed.data.campaignId}` : '/admin/kampanyok';
  const client = await mutationClient('admin');
  if (!client || !parsed.success) redirectWith(path, 'error', 'Érvénytelen tömeges művelet.');
  const { data, error } = await client.rpc('admin_bulk_set_filtered_campaign_schools', {
    requested_campaign_id: parsed.data.campaignId, requested_query: parsed.data.query,
    requested_county: parsed.data.county, requested_city: parsed.data.city,
    requested_participation: parsed.data.participation, requested_active: parsed.data.active === 'true',
  });
  if (error) redirectWith(path, 'error', 'A tömeges művelet nem hajtható végre.');
  revalidateTag('public-campaign', 'max'); revalidatePath(path); revalidatePath('/admin');
  redirectWith(path, 'success', `${Number(data) || 0} részvételi rekord módosult.`);
}

const schoolSchema = z.object({
  id: z.uuid(), name: z.string().trim().min(2).max(240), slug, type: z.enum(schoolTypes),
  city: z.string().trim().min(1).max(120), county: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().regex(/^[0-9]{4}$/).or(z.literal('')),
  address: z.string().trim().max(240), active: z.enum(['true', 'false']),
});

export async function updateSchoolAction(formData: FormData) {
  const parsed = schoolSchema.safeParse({ id: formData.get('school_id'), name: formData.get('name'),
    slug: formData.get('slug'), type: formData.get('type'), city: formData.get('city'),
    county: formData.get('county'), postalCode: formData.get('postal_code') ?? '',
    address: formData.get('address') ?? '', active: formData.get('active') });
  const path = parsed.success ? `/admin/iskolak/${parsed.data.id}` : '/admin/iskolak';
  const client = await mutationClient('admin');
  if (!client || !parsed.success) redirectWith(path, 'error', 'Ellenőrizd az iskola adatait.');
  const { error } = await client.rpc('admin_update_school', {
    requested_school_id: parsed.data.id, requested_name: parsed.data.name, requested_slug: parsed.data.slug,
    requested_type: parsed.data.type, requested_city: parsed.data.city, requested_county: parsed.data.county,
    requested_postal_code: parsed.data.postalCode || null, requested_address: parsed.data.address || null,
    requested_active: parsed.data.active === 'true',
  });
  if (error) redirectWith(path, 'error', error.code === '23505' ? 'Ez a slug már használatban van.' : 'Az iskola nem menthető.');
  revalidateTag('public-campaign', 'max'); revalidatePath('/admin/iskolak'); revalidatePath(path); revalidatePath('/');
  redirectWith(path, 'success', 'Az iskola adatai frissültek.');
}

const newsSchema = z.object({
  id: uuidOrNull, title: z.string().trim().min(2).max(200), slug,
  excerpt: z.string().trim().min(1).max(800), content: z.string().trim().min(1).max(40000),
  published: z.boolean(), publishedAt: z.string().trim().nullable(),
});

export async function saveNewsAction(formData: FormData) {
  const parsed = newsSchema.safeParse({ id: formData.get('news_id'), title: formData.get('title'),
    slug: formData.get('slug'), excerpt: formData.get('excerpt'), content: formData.get('content'),
    published: formData.get('published') === 'on', publishedAt: formData.get('published_at') || null });
  const fallback = parsed.success && parsed.data.id ? `/admin/hirek/${parsed.data.id}` : '/admin/hirek';
  if (!parsed.success || (parsed.data.published && !parsed.data.publishedAt)) redirectWith(fallback, 'error', 'Ellenőrizd a hír kötelező mezőit.');
  const publishedAt = parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : null;
  if (publishedAt && Number.isNaN(publishedAt.getTime())) redirectWith(fallback, 'error', 'Érvénytelen publikálási dátum.');
  const client = await mutationClient('admin');
  if (!client) redirectWith(fallback, 'error', 'Érvénytelen kérés.');
  const { data, error } = await client.rpc('admin_save_news', {
    requested_news_id: parsed.data.id, requested_title: parsed.data.title, requested_slug: parsed.data.slug,
    requested_excerpt: parsed.data.excerpt, requested_content: parsed.data.content,
    requested_published: parsed.data.published, requested_published_at: publishedAt?.toISOString() ?? null,
  });
  const id = z.uuid().safeParse(data);
  if (error || !id.success) redirectWith(fallback, 'error', error?.code === '23505' ? 'Ez a slug már használatban van.' : 'A hír nem menthető.');
  revalidateTag('public-news', 'max'); revalidatePath('/'); revalidatePath('/admin/hirek'); revalidatePath(`/admin/hirek/${id.data}`);
  redirectWith(`/admin/hirek/${id.data}`, 'success', 'A hír mentése sikerült.');
}

async function findAuthUserByEmail(email: string) {
  const privileged = createPrivilegedSupabaseClient();
  if (!privileged) return null;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await privileged.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return null;
    const match = data.users.find((user) => user.email?.toLocaleLowerCase('hu-HU') === email.toLocaleLowerCase('hu-HU'));
    if (match) return match;
    if (data.users.length < 100) break;
  }
  return null;
}

export async function inviteAdministratorAction(formData: FormData) {
  const parsed = z.object({ email: z.email(), role: z.enum(administratorRoles) }).safeParse({
    email: formData.get('email'), role: formData.get('role'),
  });
  const client = await mutationClient('super_admin');
  if (!client || !parsed.success) redirectWith('/admin/adminisztratorok', 'error', 'Ellenőrizd a meghívási adatokat.');
  const privileged = createPrivilegedSupabaseClient();
  if (!privileged) redirectWith('/admin/adminisztratorok', 'error', 'Hiányzó szerverkonfiguráció.');
  const callbackUrl = new URL('/auth/callback', environment.SITE_URL).toString();
  const invitation = await privileged.auth.admin.inviteUserByEmail(parsed.data.email, { redirectTo: callbackUrl });
  const user = invitation.data.user ?? (await findAuthUserByEmail(parsed.data.email));
  if (!user) redirectWith('/admin/adminisztratorok', 'error', 'A meghívás most nem küldhető el.');
  const { error } = await client.rpc('admin_manage_administrator', {
    requested_user_id: user.id, requested_role: parsed.data.role, requested_active: true,
  });
  if (error) redirectWith('/admin/adminisztratorok', 'error', 'A meghívott jogosultsága nem menthető.');
  revalidatePath('/admin/adminisztratorok');
  redirectWith('/admin/adminisztratorok', 'success', invitation.error ? 'A meglévő fiók jogosultsága frissült.' : 'A meghívó elküldve.');
}

export async function manageAdministratorAction(formData: FormData) {
  const parsed = z.object({ userId: z.uuid(), role: z.enum(administratorRoles), active: z.enum(['true', 'false']) }).safeParse({
    userId: formData.get('user_id'), role: formData.get('role'), active: formData.get('active'),
  });
  const client = await mutationClient('super_admin');
  if (!client || !parsed.success) redirectWith('/admin/adminisztratorok', 'error', 'Érvénytelen kérés.');
  const { error } = await client.rpc('admin_manage_administrator', {
    requested_user_id: parsed.data.userId, requested_role: parsed.data.role,
    requested_active: parsed.data.active === 'true',
  });
  if (error) redirectWith('/admin/adminisztratorok', 'error', error.code === '55000' ? 'Az utolsó aktív Super Admin nem módosítható így.' : 'A jogosultság nem módosítható.');
  revalidatePath('/admin/adminisztratorok'); revalidatePath('/admin');
  redirectWith('/admin/adminisztratorok', 'success', 'Az adminisztrátori jogosultság frissült.');
}
