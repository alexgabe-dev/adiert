'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { environment } from '@/lib/env';
import { hasValidMutationOrigin } from '@/lib/security/origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireTeacherAccount, teacherEntryStatus } from './server';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { allowTeacherAuth } from './auth-rate-limit';
import { authErrorMessage } from './auth-error';
import { matchesPostalCity } from './registration-location';
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
    const { error } = await client.auth.resetPasswordForEmail(email.data, {
      redirectTo: callback.toString(),
    });
    if (error) return { status: 'error', message: authErrorMessage(error) };
    return {
      status: 'success',
      message: 'Ha a címhez tartozik fiók, elküldtük a jelszó-visszaállító hivatkozást.',
    };
  }
  if (mode === 'resend') {
    if (!(await allowTeacherAuth(email.data)))
      return { status: 'error', message: 'Túl sok próbálkozás történt. Kérj új linket később.' };
    const admin = createPrivilegedSupabaseClient();
    if (!admin) return { status: 'error', message: 'A levélküldés most nem érhető el.' };
    const { data: member, error: memberError } = await admin
      .from('school_memberships')
      .select('user_id,school_id')
      .eq('email', email.data.toLowerCase())
      .eq('active', true)
      .maybeSingle();
    if (memberError) return { status: 'error', message: 'A kérést most nem sikerült feldolgozni.' };
    if (member) {
      const { error } = await admin.from('email_outbox').insert({
        recipient: email.data.toLowerCase(),
        subject: 'Regisztráció megerősítése — Palackverseny',
        body: 'Az iskolai jelentkezésedet elfogadtuk. Az alábbi gombbal erősítheted meg a fiókodat és léphetsz be.',
        link_path: '/tanar',
        kind: 'activation',
        target_user_id: member.user_id,
      });
      if (error) return { status: 'error', message: 'A levelet nem sikerült sorba állítani.' };
      scheduleNotifications();
    } else {
      // Invited colleagues and legacy accounts retain their existing confirmation flow.
      const { data: application } = await admin
        .from('school_applications')
        .select('id')
        .eq('email', email.data.toLowerCase())
        .maybeSingle();
      if (!application)
        await client.auth.resend({
          type: 'signup',
          email: email.data,
          options: { emailRedirectTo: callback.toString() },
        });
    }
    return {
      status: 'success',
      message:
        'Ha a jelentkezésedet már elfogadtuk, elküldjük a megerősítő linket. Jóváhagyás előtt nincs további teendőd.',
    };
  }
  if (password.length < 10 || password.length > 128)
    return { status: 'error', message: 'A jelszó 10–128 karakter hosszú legyen.' };
  if (mode === 'signup') {
    const registration = z
      .object({
        school_id: z.uuid(),
        postal_code: z.string().regex(/^\d{4}$/),
        city: z.string().trim().min(2).max(120),
        contact_name: z.string().trim().min(2).max(120),
      })
      .safeParse(Object.fromEntries(form));
    if (!registration.success)
      return { status: 'error', message: 'Válaszd ki az iskoládat, és add meg a teljes nevedet.' };
    const details = registration.data;
    if (!matchesPostalCity(details.postal_code, details.city))
      return {
        status: 'error',
        message: 'Az irányítószám és a település nem egyezik. Válaszd ki újra az iskolát.',
      };
    const catalog = createPrivilegedSupabaseClient();
    if (!catalog) return { status: 'error', message: 'Az iskolák adatai most nem érhetők el.' };
    const { data: school, error: schoolError } = await catalog
      .from('schools')
      .select('id,city')
      .eq('id', details.school_id)
      .eq('active', true)
      .or('type.eq.primary_school,and(type.eq.other,import_key.not.is.null)')
      .maybeSingle();
    if (schoolError || !school || !matchesPostalCity(details.postal_code, school.city))
      return {
        status: 'error',
        message: 'Az iskola nem tartozik a kiválasztott településhez, vagy már nem választható.',
      };
    if (!(await allowTeacherAuth(email.data)))
      return {
        status: 'error',
        message: 'Túl sok regisztrációs próbálkozás történt. Kérjük, próbáld meg később.',
      };
    const { error } = await catalog.auth.admin.createUser({
      email: email.data.toLowerCase(),
      password,
      email_confirm: false,
      user_metadata: { school_registration: { ...details, city: school.city } },
    });
    if (error && !['email_exists', 'user_already_exists'].includes(error.code ?? '')) {
      console.error('Teacher signup failed', { code: error.code, status: error.status });
      return { status: 'error', message: authErrorMessage(error) };
    }
    if (!error) scheduleNotifications();
    return {
      status: 'success',
      message:
        'Köszönjük a jelentkezésedet! Új regisztráció esetén visszaigazolást küldünk. A szervezők ellenőrzik az adatokat, majd elfogadás után e-mailben kapod meg a megerősítő linket. Ha már van fiókod, használd a belépést.',
    };
  }
  if (mode !== 'login') return { status: 'error', message: 'Érvénytelen művelet.' };
  const { data: loginData, error } = await client.auth.signInWithPassword({
    email: email.data,
    password,
  });
  if (error)
    return {
      status: 'error',
      message:
        error.code === 'email_not_confirmed'
          ? 'A fiókod még nincs aktiválva. Az admin elfogadása után kapott levélben erősítsd meg a regisztrációdat. Ha még nem kaptál elfogadó levelet, várd meg a döntést.'
          : 'Nem sikerült belépni. Ellenőrizd az e-mail-címedet és a jelszavadat.',
    };
  if (loginData.user) {
    const status = await teacherEntryStatus(client, loginData.user);
    if (['pending', 'rejected', 'paused'].includes(status)) {
      await client.auth.signOut();
      return {
        status: 'error',
        message:
          status === 'pending'
            ? 'A jelentkezésed még jóváhagyásra vár. Az elfogadásról e-mailben értesítünk; utána tudsz belépni.'
            : status === 'rejected'
              ? 'A jelentkezésedet nem fogadtuk el. A részleteket az értesítő e-mailben találod.'
              : 'Az iskolai hozzáférésed jelenleg szünetel. Egyeztess az iskola adminjával.',
      };
    }
  }
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
        ? 'Meghívás létrehozva. A kolléga a saját fiókjában, a Meghívásaim oldalon csatlakozhat.'
        : 'A változtatást mentettük.',
  };
}
