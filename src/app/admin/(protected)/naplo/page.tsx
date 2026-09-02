import Link from 'next/link';

import { listAudit } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface AuditPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireAdministratorRole('super_admin');
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');
  const parameters = await searchParams;
  const requestedPage = Number(first(parameters.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listAudit(client, page, 30);
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <section>
      <p className="text-xs font-extrabold tracking-[0.16em] text-blue-600 uppercase">
        Változtathatatlan eseménytár
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Operatív napló</h1>
      <p className="mt-2 text-sm text-[#667085]">
        Kampány-, részvétel-, iskola-, hír- és adminisztrátori műveletek. A napló normál úton nem
        írható át és nem törölhető.
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8ECF2] bg-white">
        <div className="border-b border-[#E8ECF2] px-5 py-3 text-xs font-bold text-[#667085]">
          {result.total.toLocaleString('hu-HU')} esemény
        </div>
        {result.items.length ? (
          <ol className="divide-y divide-slate-100">
            {result.items.map((item) => (
              <li
                key={item.id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[180px_1fr_auto] lg:items-start"
              >
                <time dateTime={item.created_at} className="text-xs text-[#667085]">
                  {new Intl.DateTimeFormat('hu-HU', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  }).format(new Date(item.created_at))}
                </time>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-blue-700">{item.action}</p>
                  <p className="mt-1 truncate text-sm font-bold">{item.target_label}</p>
                  <p className="mt-1 text-xs text-[#667085]">{safeMetadata(item.metadata)}</p>
                </div>
                <p className="font-mono text-[10px] text-slate-400" title={item.actor_user_id}>
                  aktor {item.actor_user_id.slice(0, 8)}…
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="p-8 text-center text-sm text-[#667085]">Még nincs operatív esemény.</p>
        )}
      </div>
      <nav aria-label="Lapozás" className="mt-5 flex items-center justify-between gap-4">
        {page > 1 ? (
          <Link
            href={{ pathname: '/admin/naplo', query: { page: page - 1 } }}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          >
            ← Előző
          </Link>
        ) : (
          <span />
        )}
        <span className="text-xs text-[#667085]">
          {page}. / {pageCount} oldal
        </span>
        {page < pageCount ? (
          <Link
            href={{ pathname: '/admin/naplo', query: { page: page + 1 } }}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          >
            Következő →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </section>
  );
}

function safeMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);
  if (!entries.length) return 'Nincs kiegészítő metaadat';
  return entries
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : 'összetett érték'}`,
    )
    .join(' · ');
}
