import Link from 'next/link';
import { z } from 'zod';

import {
  listAdminSubmissions,
  submissionStatuses,
  type SubmissionStatus,
} from '@/features/admin/submissions';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const pageSize = 20;
const statusLabels: Record<SubmissionStatus | 'all', string> = {
  pending: 'Függőben',
  needs_review: 'Javítást kérünk',
  approved: 'Jóváhagyott',
  rejected: 'Elutasított',
  all: 'Mind',
};

const statusClasses: Record<SubmissionStatus, string> = {
  pending: 'bg-blue-50 text-blue-800',
  needs_review: 'bg-amber-50 text-amber-800',
  approved: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-rose-50 text-rose-800',
};

interface AdminSubmissionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSubmissionsPage({ searchParams }: AdminSubmissionsPageProps) {
  await requireAdministratorRole('reviewer');
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error('Admin database connection is unavailable');

  const parameters = await searchParams;
  const requestedStatus = firstValue(parameters.status);
  const status: SubmissionStatus | 'all' =
    requestedStatus === 'all' || submissionStatuses.includes(requestedStatus as SubmissionStatus)
      ? (requestedStatus as SubmissionStatus | 'all')
      : 'pending';
  const schoolSearch = (firstValue(parameters.school) ?? '').trim().slice(0, 100);
  const dateFrom = z.iso.date().safeParse(firstValue(parameters.from)).data;
  const dateTo = z.iso.date().safeParse(firstValue(parameters.to)).data;
  const requestedPage = Number(firstValue(parameters.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listAdminSubmissions(supabase, {
    status,
    schoolSearch,
    dateFrom,
    dateTo,
    page,
    pageSize,
  });
  const pageCount = Math.max(1, Math.ceil(result.total / pageSize));

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold tracking-widest text-[#246BFD] uppercase">
            Kézi ellenőrzés
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Beküldések</h1>
        </div>
        <p className="text-sm font-semibold text-[#667085]">{result.total} találat</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Állapotszűrő">
        {(['pending', 'needs_review', 'approved', 'rejected', 'all'] as const).map((value) => (
          <Link
            key={value}
            href={{
              pathname: '/admin/bekuldesek',
              query: { status: value, school: schoolSearch, from: dateFrom, to: dateTo },
            }}
            className={`rounded-full px-3 py-2 text-xs font-bold ${
              status === value ? 'bg-[#0B1535] text-white' : 'border border-slate-200 bg-white'
            }`}
          >
            {statusLabels[value]}
          </Link>
        ))}
      </div>

      <form method="get" className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="status" value={status} />
        <label htmlFor="school-search" className="sr-only">
          Iskola keresése
        </label>
        <input
          id="school-search"
          name="school"
          type="search"
          defaultValue={schoolSearch}
          placeholder="Keresés iskola neve alapján"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <label className="text-xs text-slate-500">
          Visszaváltás ettől
          <input name="from" type="date" defaultValue={dateFrom} className="field" />
        </label>
        <label className="text-xs text-slate-500">
          Eddig
          <input name="to" type="date" defaultValue={dateTo} className="field" />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          Szűrés
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8ECF2] bg-white shadow-sm">
        {result.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#667085]">
            Nincs a szűrésnek megfelelő beküldés.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {result.items.map((submission) => (
              <li key={submission.id}>
                <Link
                  href={`/admin/bekuldesek/${submission.id}`}
                  className="grid gap-3 p-4 transition-colors hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate">{submission.schoolName}</strong>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClasses[submission.status]}`}
                      >
                        {statusLabels[submission.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#667085]">
                      {submission.schoolCity ? `${submission.schoolCity} · ` : ''}
                      {submission.campaignName} · {submission.submittedBottleCount ?? '—'} beküldött
                      palack
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                      {submission.publicReference}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <time
                      className="text-xs font-semibold text-[#667085]"
                      dateTime={submission.createdAt}
                    >
                      {new Intl.DateTimeFormat('hu-HU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(submission.createdAt))}
                    </time>
                    {submission.fraudScore === null ? null : (
                      <p className="mt-1 text-[11px] font-bold text-amber-700">
                        Kockázati jelzés: {submission.fraudScore}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <nav aria-label="Lapozás" className="mt-6 flex items-center justify-between gap-4">
        {page > 1 ? (
          <Link
            href={{
              pathname: '/admin/bekuldesek',
              query: { status, school: schoolSearch, from: dateFrom, to: dateTo, page: page - 1 },
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold"
          >
            ← Előző
          </Link>
        ) : (
          <span />
        )}
        <span className="text-xs font-semibold text-[#667085]">
          {page}. / {pageCount} oldal
        </span>
        {page < pageCount ? (
          <Link
            href={{
              pathname: '/admin/bekuldesek',
              query: { status, school: schoolSearch, from: dateFrom, to: dateTo, page: page + 1 },
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold"
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
