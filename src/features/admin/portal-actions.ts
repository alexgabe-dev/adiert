'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { hasValidMutationOrigin } from '@/lib/security/origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { friendlyError, type ActionState } from '@/features/teacher/shared';
import { scheduleNotifications } from '@/features/teacher/notifications';
export async function decideApplication(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!(await hasValidMutationOrigin())) return { status: 'error', message: 'Érvénytelen kérés.' };
  await requireAdministratorRole('admin');
  const client = await createServerSupabaseClient();
  const parsed = z
    .object({
      id: z.uuid(),
      version: z.coerce.number().int().positive(),
      status: z.enum(['approved', 'rejected', 'needs_changes']),
      reason: z.string().trim().max(500),
      school: z.preprocess((v) => (v === '' ? null : v), z.uuid().nullable()),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success || !client)
    return { status: 'error', message: 'Ellenőrizd a döntés adatait.' };
  const d = parsed.data;
  const { error } = await client.rpc('decide_school_application', {
    p_id: d.id,
    p_version: d.version,
    p_status: d.status,
    p_reason: d.reason || null,
    p_school: d.school,
  });
  if (error) return { status: 'error', message: friendlyError(error.message) };
  scheduleNotifications();
  const mail = { configured: !!process.env.RESEND_API_KEY && !!process.env.NOTIFICATION_FROM };
  revalidatePath('/admin');
  revalidatePath('/tanar');
  return {
    status: 'success',
    message: `A döntést mentettük. ${mail.configured ? 'Az értesítés a küldési sorba került.' : 'Az értesítés várakozik; a levélküldést még be kell állítani.'}`,
  };
}
export async function retryNotifications(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!(await hasValidMutationOrigin())) return { status: 'error', message: 'Érvénytelen kérés.' };
  await requireAdministratorRole('admin');
  const client = createPrivilegedSupabaseClient();
  const id = z.uuid().safeParse(form.get('id'));
  if (!client || !id.success) return { status: 'error', message: 'Érvénytelen kérés.' };
  const { error } = await client
    .from('email_outbox')
    .update({ status: 'pending', attempts: 0, last_error: null })
    .eq('id', id.data)
    .in('status', ['pending', 'failed']);
  if (error) return { status: 'error', message: 'Az értesítést nem sikerült újra sorba állítani.' };
  scheduleNotifications();
  const result = { configured: !!process.env.RESEND_API_KEY && !!process.env.NOTIFICATION_FROM };
  revalidatePath('/admin/ertesitesek');
  return {
    status: result.configured ? 'success' : 'error',
    message: result.configured
      ? 'A küldést újra sorba állítottuk. Frissítsd a listát az eredmény megtekintéséhez.'
      : 'A levélküldés még nincs beállítva. Az értesítés megmaradt a küldési sorban.',
  };
}

export async function updateContact(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!(await hasValidMutationOrigin())) return { status: 'error', message: 'Érvénytelen kérés.' };
  await requireAdministratorRole('admin');
  const parsed = z
    .object({ user: z.uuid(), name: z.string().trim().min(2).max(120) })
    .safeParse(Object.fromEntries(form));
  const client = await createServerSupabaseClient();
  if (!parsed.success || !client)
    return { status: 'error', message: 'Adj meg érvényes kapcsolattartói nevet.' };
  const { error } = await client.rpc('update_school_contact', {
    p_user: parsed.data.user,
    p_name: parsed.data.name,
  });
  if (error) return { status: 'error', message: friendlyError(error.message) };
  revalidatePath('/admin/iskolak');
  return { status: 'success', message: 'Kapcsolattartó frissítve.' };
}
