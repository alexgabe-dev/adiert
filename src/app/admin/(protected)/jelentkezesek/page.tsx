import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SchoolApplication } from '@/features/teacher/server';
import { ApplicationDecision } from '@/components/admin/ApplicationDecision';
import Link from 'next/link';
export default async function Applications({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdministratorRole('admin');
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Nincs adatbázis-kapcsolat.');
  const p = await searchParams;
  const status = ['pending', 'approved', 'rejected', 'needs_changes'].includes(p.status ?? '')
    ? p.status!
    : 'pending';
  const page = Math.max(1, Number(p.page) || 1);
  const { data, error, count } = await client
    .from('school_applications')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error('A jelentkezések nem tölthetők be.');
  return (
    <section>
      <h1 className="text-3xl font-extrabold">Iskolai jelentkezések</h1>
      <p className="mt-3 text-sm text-slate-600">
        Az elfogadott kapcsolattartó az iskola adminja lesz. A döntésről e-mailben értesítjük.
      </p>
      <form className="my-6 flex max-w-md gap-2">
        <select
          name="status"
          defaultValue={status}
          aria-label="Jelentkezés állapota"
          className="field"
        >
          <option value="pending">Jóváhagyásra vár</option>
          <option value="needs_changes">Pontosítást kértünk</option>
          <option value="approved">Elfogadva</option>
          <option value="rejected">Elutasítva</option>
        </select>
        <button className="rounded-xl bg-white px-4 font-bold">Szűrés</button>
      </form>
      <div className="grid gap-5 xl:grid-cols-2">
        {((data ?? []) as SchoolApplication[]).map((a) => (
          <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold">{a.school_name}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {a.postal_code} {a.city}
            </p>
            <p className="mt-3 font-semibold">{a.contact_name}</p>
            <p className="mt-1 break-all text-sm text-slate-600">{a.email}</p>
            {a.reason && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">{a.reason}</p>}
            <div className="mt-5">
              {a.status !== 'approved' ? (
                <ApplicationDecision application={a} />
              ) : (
                a.school_id && (
                  <Link href={`/admin/iskolak/${a.school_id}`} className="font-bold text-blue-600">
                    Iskola megnyitása →
                  </Link>
                )
              )}
            </div>
          </article>
        ))}
      </div>
      {!data?.length && (
        <p className="rounded-2xl bg-white p-8 text-slate-500">Nincs ilyen állapotú jelentkezés.</p>
      )}
      <div className="mt-6 flex justify-between text-sm font-bold text-blue-600">
        {page > 1 ? (
          <Link href={`/admin/jelentkezesek?status=${status}&page=${page - 1}`}>← Előző</Link>
        ) : (
          <span />
        )}
        {page * 20 < (count ?? 0) && (
          <Link href={`/admin/jelentkezesek?status=${status}&page=${page + 1}`}>Következő →</Link>
        )}
      </div>
    </section>
  );
}
