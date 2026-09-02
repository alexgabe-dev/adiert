import Link from 'next/link';

import { listNews } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function NewsPage() {
  await requireAdministratorRole('admin');
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');
  const items = await listNews(client);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.16em] text-blue-600 uppercase">
            Tartalomkezelés
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Hírek</h1>
          <p className="mt-2 text-sm text-[#667085]">
            Piszkozatok és publikált hírek egyszerű, biztonságos szöveges tartalommal.
          </p>
        </div>
        <Link
          href="/admin/hirek/uj"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white hover:bg-blue-700"
        >
          Új hír
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8ECF2] bg-white">
        {items.length ? (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/hirek/${item.id}`}
                  className="grid min-h-16 gap-2 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate">{item.title}</strong>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {item.published ? 'Publikált' : 'Piszkozat'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[#667085]">{item.excerpt}</p>
                  </div>
                  <time className="text-xs text-[#667085]" dateTime={item.updated_at}>
                    {new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium' }).format(
                      new Date(item.updated_at),
                    )}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-sm text-[#667085]">Még nincs hír.</p>
        )}
      </div>
    </section>
  );
}
