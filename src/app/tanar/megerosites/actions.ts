'use server';
import { createHash } from 'node:crypto';
import { redirect } from 'next/navigation';
import { hasValidMutationOrigin } from '@/lib/security/origin';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { teacherEntryStatus } from '@/features/teacher/server';
import type { ActionState } from '@/features/teacher/shared';
export async function activateTeacher(_state: ActionState, form: FormData): Promise<ActionState> {
  const invalid: ActionState = {
    status: 'error',
    message:
      'Ez a link lejárt, már felhasználtad, vagy a hozzáférésed megváltozott. Kérj új megerősítő levelet az alábbi hivatkozáson.',
  };
  if (!(await hasValidMutationOrigin())) return invalid;
  const token = String(form.get('token') ?? '');
  if (!/^[a-f0-9]{64}$/.test(token)) return invalid;
  const admin = createPrivilegedSupabaseClient();
  const client = await createServerSupabaseClient();
  if (!admin || !client) return invalid;
  const { data: id, error } = await admin.rpc('consume_teacher_activation', {
    p_hash: createHash('sha256').update(token).digest('hex'),
  });
  if (error || !id) return invalid;
  const { data: account } = await admin.auth.admin.getUserById(id);
  if (!account.user?.email) return invalid;
  const { data: generated, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: account.user.email,
  });
  if (linkError || generated.user?.id !== id) return invalid;
  const { data, error: verifyError } = await client.auth.verifyOtp({
    token_hash: generated.properties.hashed_token,
    type: 'email',
  });
  if (verifyError || !data.user || data.user.id !== id) {
    await client.auth.signOut();
    return invalid;
  }
  const status = await teacherEntryStatus(client, data.user);
  if (!['approved', 'invited'].includes(status)) {
    await client.auth.signOut();
    return invalid;
  }
  redirect(status === 'invited' ? '/tanar/meghivasok' : '/tanar');
}
