'use server';

import { z } from 'zod';

import { environment } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const signInSchema = z.object({
  email: z.email(),
});

export interface SignInState {
  status: 'idle' | 'error' | 'sent';
  message: string;
}

export const initialSignInState: SignInState = {
  status: 'idle',
  message: '',
};

export async function signInAction(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
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

  const callbackUrl = new URL('/auth/callback', environment.NEXT_PUBLIC_SITE_URL).toString();
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
