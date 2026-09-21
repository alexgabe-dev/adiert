'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { environment } from '@/lib/env';
import { hasValidMutationOrigin } from '@/lib/security/origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireTeacherAccount } from './server';
import { applicationSchema, friendlyError, type ActionState } from './shared';
import { scheduleNotifications } from './notifications';

export async function teacherAuthAction(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!(await hasValidMutationOrigin())) return { status: 'error', message: 'Érvénytelen kérés.' };
  const client = await createServerSupabaseClient();
  if (!client) return { status: 'error', message: 'A belépés jelenleg nincs beállítva.' };
  const mode = String(form.get('mode'));
  const email = z.email().safeParse(String(form.get('email') ?? '').trim());
  const password = String(form.get('password') ?? '');
  if (mode === 'update_password') {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user || password.length < 10)
      return {
        status: 'error',
        message: 'Lépj be a kapott hivatkozással, és adj meg legalább 10 karakteres jelszót.',
      };
    const { error } = await client.auth.updateUser({ password });
    if (error) return { status: 'error', message: 'A jelszót nem sikerült módosítani.' };
    redirect('/tanar');
  }
  if (!email.success) return { status: 'error', message: 'Adj meg érvényes e-mail-címet.' };
  const callback = new URL('/auth/callback', environment.SITE_URL);
  callback.searchParams.set('next', mode === 'reset' ? '/tanar/jelszo' : '/tanar');
  if (mode === 'reset') {
    await client.auth.resetPasswordForEmail(email.data, { redirectTo: callback.toString() });
    return {
      status: 'success',
      message: 'Ha a címhez tartozik fiók, elküldtük a jelszó-visszaállító hivatkozást.',
    };
  }
  if (mode === 'resend') {
    await client.auth.resend({
      type: 'signup',
      email: email.data,
      options: { emailRedirectTo: callback.toString() },
    });
    return {
      status: 'success',
      message: 'Ha szükséges, új megerősítő üzenetet küldtünk. Ellenőrizd a levélszemét mappát is.',
    };
  }
  if (password.length < 10 || password.length > 128)
    return { status: 'error', message: 'A jelszó 10–128 karakter hosszú legyen.' };
  if (mode === 'signup') {
    const { error } = await client.auth.signUp({
      email: email.data,
      password,
      options: { emailRedirectTo: callback.toString() },
    });
    if (error)
      return {
        status: 'error',
        message:
          'A regisztráció most nem sikerült. Ha van már fiókod, lépj be vagy kérj új jelszót.',
      };
    return {
      status: 'success',
      message:
        'Nézd meg a postaládádat! Erősítsd meg az e-mail-címedet, majd add meg az iskolád adatait. Ha már regisztráltál, lépj be.',
    };
  }
  if (mode !== 'login') return { status: 'error', message: 'Érvénytelen művelet.' };
  const { error } = await client.auth.signInWithPassword({ email: email.data, password });
  if (error)
    return {
      status: 'error',
      message: 'Nem sikerült belépni. Ellenőrizd az adatokat és az e-mail-cím megerősítését.',
    };
  redirect('/tanar');
}
export async function teacherSignOut() {
  if (!(await hasValidMutationOrigin())) return;
  const client = await createServerSupabaseClient();
  await client?.auth.signOut();
  redirect('/tanar/belepes');
}
export async function applySchoolAction(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!(await hasValidMutationOrigin())) return { status: 'error', message: 'Érvénytelen kérés.' };
  const { client } = await requireTeacherAccount();
  const parsed = applicationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      status: 'error',
      message:
        'Töltsd ki az iskola és a kapcsolattartó adatait. Az irányítószám négy számjegy legyen.',
    };
  const d = parsed.data;
  const { error } = await client.rpc('apply_for_school', {
    p_school: d.school_id,
    p_name: d.school_name,
    p_city: d.city,
    p_postal: d.postal_code,
    p_contact: d.contact_name,
  });
  if (error) return { status: 'error', message: friendlyError(error.message) };
  revalidatePath('/tanar/jelentkezes');
  return {
    status: 'success',
    message: 'Megérkezett a jelentkezésed! A döntésről e-mailben értesítünk.',
  };
}
export async function teamAction(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!(await hasValidMutationOrigin())) return { status: 'error', message: 'Érvénytelen kérés.' };
  const { client } = await requireTeacherAccount();
  const action = String(form.get('intent'));
  const id = z.uuid().safeParse(form.get('id'));
  if (!id.success) return { status: 'error', message: 'Érvénytelen azonosító.' };
  let result;
  if (action === 'invite') {
    const email = z.email().safeParse(String(form.get('email')).trim());
    if (!email.success) return { status: 'error', message: 'Adj meg érvényes e-mail-címet.' };
    result = await client.rpc('invite_school_teacher', { p_school: id.data, p_email: email.data });
  } else if (action === 'accept') {
    result = await client.rpc('accept_school_invitation', {
      p_id: id.data,
      p_name: String(form.get('name') ?? ''),
    });
  } else if (['remove', 'revoke_invite', 'transfer_owner'].includes(action)) {
    const target = z.uuid().safeParse(form.get('target'));
    if (!target.success) return { status: 'error', message: 'Érvénytelen azonosító.' };
    result = await client.rpc('manage_school_member', {
      p_school: id.data,
      p_target: target.data,
      p_action: action,
    });
  } else return { status: 'error', message: 'Ismeretlen művelet.' };
  if (result.error) return { status: 'error', message: friendlyError(result.error.message) };
  if (action === 'invite') scheduleNotifications();
  revalidatePath('/tanar');
  revalidatePath('/admin/iskolak');
  if (action === 'accept') redirect('/tanar');
  return {
    status: 'success',
    message:
      action === 'invite'
        ? 'Meghívás rögzítve. A kolléga e-mailben kap értesítést.'
        : 'A változtatást mentettük.',
  };
}
