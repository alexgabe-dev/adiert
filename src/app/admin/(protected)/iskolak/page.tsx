import Link from 'next/link';

import { listSchools } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface SchoolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function SchoolsPage({ searchParams }: SchoolsPageProps) {
  await requireAdministratorRole('admin');
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');

  const parameters = await searchParams;
  const query = (first(parameters.q) ?? '').trim().slice(0, 120);
  const city = (first(parameters.city) ?? '').trim().slice(0, 80);
  const county = (first(parameters.county) ?? '').trim().slice(0, 80);
  const state = first(parameters.state);
  const active = state === 'active' ? true : state === 'inactive' ? false : null;
  const requestedPage = Number(first(parameters.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listSchools(client, { query, city, county, active, page, pageSize: 25 });
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
  const linkQuery = { q: query, city, county, state: state ?? 'all' };

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.16em] text-blue-600 uppercase">
            Törzsadatok
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Iskolák</h1>
          <p className="mt-2 text-sm text-[#667085]">
            Kereshető intézményi adatok és biztonságos aktiválás.
          </p>
        </div>
        <Link
          href="/admin/iskolak/uj"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white hover:bg-blue-700"
        >
          Új iskola
        </Link>
      </div>

      <form
        method="get"
        className="mt-6 grid gap-3 rounded-2xl border border-[#E8ECF2] bg-white p-4 md:grid-cols-4"
      >
        <label className="sr-only" htmlFor="school-query">
          Iskola keresése
        </label>
        <input
          id="school-query"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Név vagy település"
          className="field"
        />
        <label className="sr-only" htmlFor="school-city">
          Település
        </label>
        <input
          id="school-city"
          name="city"
          defaultValue={city}
          placeholder="Település"
          className="field"
        />
        <label className="sr-only" htmlFor="school-county">
          Vármegye
        </label>
        <input
          id="school-county"
          name="county"
          defaultValue={county}
          placeholder="Vármegye"
          className="field"
        />
        <label className="sr-only" htmlFor="school-state">
          Állapot
        </label>
        <select id="school-state" name="state" defaultValue={state ?? 'all'} className="field">
          <option value="all">Minden állapot</option>
          <option value="active">Aktív</option>
          <option value="inactive">Inaktív</option>
        </select>
        <button className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold md:col-span-4 md:justify-self-start">
          Szűrés
        </button>
      </form>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#E8ECF2] bg-white">
        <div className="border-b border-[#E8ECF2] px-5 py-3 text-xs font-bold text-[#667085]">
          {result.total.toLocaleString('hu-HU')} találat
        </div>
        {result.items.length ? (
          <ul className="divide-y divide-slate-100">
            {result.items.map((school) => (
              <li key={school.id}>
                <Link
                  href={`/admin/iskolak/${school.id}`}
                  className="grid min-h-16 gap-2 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate">{school.name}</strong>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${school.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {school.active ? 'Aktív' : 'Inaktív'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#667085]">
                      {school.city} · {school.county}
                    </p>
                  </div>
                  <p className="text-xs text-[#667085]">
                    {school.campaign_count} aktív kampánykapcsolat
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-sm text-[#667085]">
            Nincs a szűrésnek megfelelő iskola.
          </p>
        )}
      </div>

      <nav aria-label="Lapozás" className="mt-5 flex items-center justify-between gap-4">
        <PageLink enabled={page > 1} page={page - 1} query={linkQuery}>
          ← Előző
        </PageLink>
        <span className="text-xs text-[#667085]">
          {page}. / {pageCount} oldal
        </span>
        <PageLink enabled={page < pageCount} page={page + 1} query={linkQuery}>
          Következő →
        </PageLink>
      </nav>
    </section>
  );
}

function PageLink({
  enabled,
  page,
  query,
  children,
}: {
  enabled: boolean;
  page: number;
  query: Record<string, string>;
  children: React.ReactNode;
}) {
  if (!enabled) return <span />;
  return (
    <Link
      href={{ pathname: '/admin/iskolak', query: { ...query, page } }}
      className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
    >
      {children}
    </Link>
  );
}
