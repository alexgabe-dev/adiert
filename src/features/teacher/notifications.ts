import 'server-only';
import { setTimeout as pause } from 'node:timers/promises';
import { createHash, createHmac } from 'node:crypto';
import { renderPortalEmail } from './email-template';
import { after } from 'next/server';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { environment } from '@/lib/env';

export function scheduleNotifications() {
  after(async () => {
    await drainNotifications();
  });
}

interface Mail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  link_path: string;
  kind?: string;
  target_user_id?: string;
}
export async function dispatchNotifications() {
  const client = createPrivilegedSupabaseClient();
  if (!client || !process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM)
    return { sent: 0, configured: false };
  const { data, error } = await client.rpc('claim_email_batch');
  if (error) return { sent: 0, configured: true };
  let sent = 0;
  for (const [index, mail] of ((data ?? []) as Mail[]).entries()) {
    if (index > 0) await pause(600);
    try {
      let link: string | undefined = new URL(mail.link_path, environment.SITE_URL).toString();
      let label = 'Tanári felület megnyitása';
      let body = mail.body;
      if (
        mail.kind === 'registration_received' ||
        (mail.kind === 'notification' && mail.target_user_id)
      )
        link = undefined;
      if (mail.kind === 'activation') {
        const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET;
        if (!secret || secret.length < 32 || !mail.target_user_id)
          throw new Error('A megerősítő link nincs beállítva.');
        const token = createHmac('sha256', secret).update(`activation:${mail.id}`).digest('hex');
        const { error: tokenError } = await client.from('teacher_activations').upsert(
          {
            mail_id: mail.id,
            user_id: mail.target_user_id,
            token_hash: createHash('sha256').update(token).digest('hex'),
          },
          { onConflict: 'mail_id', ignoreDuplicates: true },
        );
        if (tokenError) throw new Error('A megerősítő link nem menthető.');
        link = new URL(`/tanar/megerosites?token=${token}`, environment.SITE_URL).toString();
        label = 'Regisztráció megerősítése';
        body +=
          '\n\nA link 7 napig érvényes, és egyszer használható. Ha lejárt, a belépési oldalon kérhetsz újat.';
      }
      const content = renderPortalEmail(mail.subject, body, link, label);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `adiert-${mail.id}`,
        },
        body: JSON.stringify({
          from: process.env.NOTIFICATION_FROM,
          to: [mail.recipient],
          subject: mail.subject,
          ...content,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok)
        throw new Error(`A levélküldő szolgáltató válasza: HTTP ${response.status}`);
      const saved = await client
        .from('email_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
        .eq('id', mail.id);
      if (saved.error) throw new Error('A kézbesítési állapot mentése sikertelen.');
      sent++;
    } catch (error) {
      await client
        .from('email_outbox')
        .update({
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Levélküldési hiba.',
        })
        .eq('id', mail.id);
    }
  }
  return { sent, configured: true, processed: data?.length ?? 0 };
}

export async function drainNotifications() {
  let sent = 0;
  for (let batch = 0; batch < 20; batch++) {
    const result = await dispatchNotifications();
    sent += result.sent;
    if (!result.configured || !('processed' in result) || !result.processed || result.processed < 5)
      return { sent, configured: result.configured };
    await pause(600);
  }
  return { sent, configured: true };
}
