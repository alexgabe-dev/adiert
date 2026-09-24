import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';

export async function allowTeacherAuth(email: string) {
  const client = createPrivilegedSupabaseClient();
  const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET;
  if (!client || !secret || secret.length < 32) return false;
  const h = await headers();
  const ip =
    h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  for (const [scope, value, max] of [
    ['teacher_auth_email', email.toLowerCase(), 3],
    ['teacher_auth_ip', ip, 30],
  ] as const) {
    const { data, error } = await client.rpc('check_submission_rate_limit', {
      requested_scope: scope,
      requested_key_hash: createHmac('sha256', secret).update(value).digest('hex'),
      maximum_requests: max,
      window_seconds: 3600,
    });
    if (error || !data?.[0]?.allowed) return false;
  }
  return true;
}
