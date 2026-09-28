import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';

type AuthLimitResult = { allowed: true } | { allowed: false; message: string };
const unavailable: AuthLimitResult = {
  allowed: false,
  message:
    'A kérést technikai hiba miatt most nem tudjuk feldolgozni. Próbáld újra néhány perc múlva. Ha továbbra sem sikerül, írj az info@palackverseny.hu címre.',
};

export async function allowTeacherAuth(email: string): Promise<AuthLimitResult> {
  try {
    const client = createPrivilegedSupabaseClient();
    const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET;
    if (!client || !secret || secret.length < 32) {
      console.error('teacher_auth_rate_limit_unavailable', { reason: 'configuration' });
      return unavailable;
    }
    const h = await headers();
    const ip =
      h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    for (const [scope, value, max] of [
      ['teacher_auth_email', email.trim().toLowerCase(), 3],
      ['teacher_auth_ip', ip, 30],
    ] as const) {
      const { data, error } = await client.rpc('check_submission_rate_limit', {
        requested_scope: scope,
        requested_key_hash: createHmac('sha256', secret).update(value).digest('hex'),
        maximum_requests: max,
        window_seconds: 3600,
      });
      const result = data?.[0];
      if (error || typeof result?.allowed !== 'boolean') {
        console.error('teacher_auth_rate_limit_unavailable', {
          reason: 'database',
          code: error?.code,
        });
        return unavailable;
      }
      if (!result.allowed) {
        const seconds = Number(result.retry_after_seconds);
        const minutes = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : 60;
        return {
          allowed: false,
          message: `Túl sok próbálkozás történt rövid idő alatt. Próbáld újra ${minutes} perc múlva.`,
        };
      }
    }
    return { allowed: true };
  } catch {
    console.error('teacher_auth_rate_limit_unavailable', { reason: 'connection' });
    return unavailable;
  }
}
