'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { localTestLoginEnabled } from '@/lib/auth/local-test-login';
import { getActiveAdministrator } from '@/lib/auth/authorization';
import { hasValidMutationOrigin } from '@/lib/security/origin';

import { environment } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SignInState } from './shared';

const signInSchema = z.object({
  email: z.email(),
});

export async function signInAction(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (!(await hasValidMutationOrigin())) return { status: 'error', message: 'Érvénytelen kérés.' };
  const parsedForm = signInSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsedForm.success) {
    return {
      status: 'error',
      message: 'Adj meg egy érvényes e-mail-címet.',
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      status: 'error',
      message: 'Az adminisztrációs belépés jelenleg nincs konfigurálva.',
    };
  }

  const callbackUrl = new URL('/auth/callback', environment.SITE_URL).toString();
  if (formData.get('mode') === 'password') {
    if (!localTestLoginEnabled())
      return { status: 'error', message: 'A tesztbelépés itt nem érhető el.' };
    const password = String(formData.get('password') ?? '');
    const { error } = await supabase.auth.signInWithPassword({
      email: parsedForm.data.email,
      password,
    });
    if (error) return { status: 'error', message: 'Hibás e-mail-cím vagy jelszó.' };
    if (!(await getActiveAdministrator())) {
      await supabase.auth.signOut();
      return {
        status: 'error',
        message: 'Ehhez a fiókhoz nincs aktív adminisztrátori hozzáférés.',
      };
    }
    redirect('/admin');
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: parsedForm.data.email,
    options: {
      emailRedirectTo: callbackUrl,
      shouldCreateUser: false,
    },
  });

  // Keep the response generic so it never reveals whether an address is invited.
  if (error) {
    return {
      status: 'sent',
      message: 'Ha a cím meghívott adminhoz tartozik, elküldtük a belépési hivatkozást.',
    };
  }

  return {
    status: 'sent',
    message: 'Ha a cím meghívott adminhoz tartozik, elküldtük a belépési hivatkozást.',
  };
}
