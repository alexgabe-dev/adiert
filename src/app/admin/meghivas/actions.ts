'use server';

import { redirect } from 'next/navigation';
import { hasValidMutationOrigin } from '@/lib/security/origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActionState } from '@/features/teacher/shared';

export async function acceptAdministratorInvitation(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const invalid: ActionState = {
    status: 'error',
    message:
      'Ez a meghívó lejárt vagy már felhasználtad. Kérj új belépési linket az admin belépési oldalán.',
  };
  if (!(await hasValidMutationOrigin())) return invalid;
  const token = String(form.get('token') ?? '');
  if (!/^[a-f0-9]{40,128}$/.test(token)) return invalid;
  const client = await createServerSupabaseClient();
  if (!client) return invalid;
  const { data, error } = await client.auth.verifyOtp({ token_hash: token, type: 'invite' });
  if (error || !data.user) return invalid;
  const { data: administrator, error: roleError } = await client
    .from('administrators')
    .select('user_id')
    .eq('user_id', data.user.id)
    .eq('active', true)
    .maybeSingle();
  if (roleError || !administrator) {
    await client.auth.signOut();
    return {
      status: 'error',
      message:
        'Ehhez a fiókhoz nincs aktív adminisztrátori hozzáférés. Kérj segítséget a meghívót küldő adminisztrátortól.',
    };
  }
  redirect('/admin');
}
