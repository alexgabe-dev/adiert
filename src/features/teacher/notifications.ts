import 'server-only';
import { after } from 'next/server';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { environment } from '@/lib/env';

export function scheduleNotifications() {
  after(async () => {
    await dispatchNotifications();
  });
}

interface Mail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  link_path: string;
}
export async function dispatchNotifications() {
  const client = createPrivilegedSupabaseClient();
  if (!client || !process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM)
    return { sent: 0, configured: false };
  const { data, error } = await client.rpc('claim_email_batch');
  if (error) return { sent: 0, configured: true };
  let sent = 0;
  for (const mail of (data ?? []) as Mail[]) {
    try {
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
          text: `${mail.body}\n\n${new URL(mail.link_path, environment.SITE_URL).toString()}\n\nÁdiért · Minden palack számít.`,
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
  return { sent, configured: true };
}
