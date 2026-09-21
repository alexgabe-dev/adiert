import Link from 'next/link';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ActionForm } from '@/components/teacher/ActionForm';
import { retryNotifications } from '@/features/admin/portal-actions';
export default async function Notifications({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdministratorRole('admin');
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Nincs adatbázis-kapcsolat.');
  const p = await searchParams;
  const page = Math.max(1, Number(p.page) || 1);
  const { data, error, count } = await client
    .from('email_outbox')
    .select('id,recipient,subject,status,attempts,last_error,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * 30, page * 30 - 1);
  if (error) throw new Error('Az értesítések nem tölthetők be.');
  return (
    <section>
      <h1 className="text-3xl font-extrabold">E-mailes értesítések</h1>
      <p className="mt-3 text-sm text-slate-500">
        A „Kiküldve” állapot azt jelenti, hogy a levélküldő szolgáltató átvette az üzenetet.
      </p>
      {(!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM) && (
        <p className="my-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          A levélküldés még nincs beállítva. Az értesítéseket megőrizzük a küldési sorban.
        </p>
      )}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {data?.map((m) => (
          <article key={m.id} className="rounded-2xl bg-white p-5">
            <p className="font-bold">{m.subject}</p>
            <p className="mt-1 break-all text-sm text-slate-600">{m.recipient}</p>
            <p className="mt-3 text-sm">
              {
                {
                  pending: 'Várakozik',
                  sending: 'Küldés alatt',
                  sent: 'Kiküldve',
                  failed: 'Sikertelen',
                }[m.status as string]
              }{' '}
              · {m.attempts} kísérlet
            </p>
            {m.last_error && <p className="mt-2 text-sm text-rose-700">{m.last_error}</p>}
            {['pending', 'failed'].includes(m.status) && (
              <ActionForm action={retryNotifications} label="Küldés újrapróbálása" className="mt-4">
                <input type="hidden" name="id" value={m.id} />
              </ActionForm>
            )}
          </article>
        ))}
      </div>
      {!data?.length && <p className="mt-6 text-slate-500">Még nincs kiküldendő értesítés.</p>}
      <div className="mt-6 flex justify-between text-sm font-bold text-blue-600">
        {page > 1 ? <Link href={`/admin/ertesitesek?page=${page - 1}`}>← Előző</Link> : <span />}
        {page * 30 < (count ?? 0) && (
          <Link href={`/admin/ertesitesek?page=${page + 1}`}>Következő →</Link>
        )}
      </div>
    </section>
  );
}
