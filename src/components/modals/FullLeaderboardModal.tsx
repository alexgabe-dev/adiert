'use client';

import { ChevronLeft, ChevronRight, LoaderCircle, Search, Trophy, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ModalDialog } from '@/components/ui/ModalDialog';
import type { LeaderboardPage, LeaderboardSchool } from '@/features/public-data/types';
import { schoolTypeLabels } from '@/features/public-data/types';

interface FullLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function isLeaderboardResponse(
  value: unknown,
): value is LeaderboardPage & { campaign: { id: string; name: string } | null } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LeaderboardPage> & { campaign?: unknown };
  return (
    (candidate.campaign === null ||
      (typeof candidate.campaign === 'object' && candidate.campaign !== null)) &&
    Array.isArray(candidate.schools) &&
    typeof candidate.totalCount === 'number' &&
    typeof candidate.page === 'number' &&
    typeof candidate.pageSize === 'number'
  );
}

export function FullLeaderboardModal({ isOpen, onClose }: FullLeaderboardModalProps) {
  const [query, setQuery] = useState('');
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<LeaderboardPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setFailed(false);
      const parameters = new URLSearchParams({ query, county, city, page: String(page) });
      if (schoolType) parameters.set('type', schoolType);
      void fetch(`/api/leaderboard?${parameters}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error('leaderboard');
          const body: unknown = await response.json();
          if (!isLeaderboardResponse(body)) throw new Error('leaderboard');
          setResult({
            schools: body.schools,
            totalCount: body.totalCount,
            page: body.page,
            pageSize: body.pageSize,
          });
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setFailed(true);
          setResult(null);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [city, county, isOpen, page, query, schoolType]);

  if (!isOpen) return null;
  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / result.pageSize)) : 1;
  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <ModalDialog
      labelId="full-leaderboard-title"
      onClose={onClose}
      className="flex max-h-[92vh] max-w-4xl flex-col rounded-3xl p-5 sm:p-8"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-700 uppercase">
            <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span>Országos bajnokság</span>
          </div>
          <h3
            id="full-leaderboard-title"
            className="mt-1 text-xl font-extrabold text-[#0B1535] sm:text-2xl"
          >
            Teljes iskolai ranglista
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-autofocus
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          aria-label="Bezárás"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="my-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Iskola keresése</span>
          <Search
            className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Iskola keresése…"
            value={query}
            onChange={(event) => setFilter(setQuery, event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-10 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
          />
        </label>
        <input
          aria-label="Vármegye szűrése"
          placeholder="Vármegye"
          value={county}
          onChange={(event) => setFilter(setCounty, event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
        />
        <input
          aria-label="Település szűrése"
          placeholder="Település"
          value={city}
          onChange={(event) => setFilter(setCity, event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
        />
        <select
          aria-label="Iskolatípus szűrése"
          value={schoolType}
          onChange={(event) => setFilter(setSchoolType, event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
        >
          <option value="">Minden rögzített típus</option>
          {Object.entries(schoolTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative min-h-32 flex-auto divide-y divide-slate-100 overflow-y-auto pr-1">
        {loading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-white/75"
            role="status"
          >
            <LoaderCircle
              className="h-6 w-6 animate-spin text-blue-600"
              aria-label="Ranglista betöltése"
            />
          </div>
        ) : null}
        {failed ? (
          <div className="py-12 text-center text-sm text-[#667085]">
            A ranglista most nem tölthető be.
          </div>
        ) : result && result.schools.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#667085]">
            Nincs jóváhagyott találat a szűrésre.
          </div>
        ) : (
          result?.schools.map((school: LeaderboardSchool) => (
            <div
              key={school.id}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-slate-50"
            >
              <Link
                href={`/iskolak/${school.slug}`}
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-3 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-700">
                  {school.rank}.
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-[#0B1535] sm:text-sm">
                    {school.name}
                  </span>
                  <span className="block truncate text-[11px] text-[#667085]">
                    {school.city} · {school.county}
                  </span>
                </span>
              </Link>
              <span className="shrink-0 text-right">
                <span className="block text-xs font-extrabold text-[#0B1535] sm:text-sm">
                  {school.approvedAmount.toLocaleString('hu-HU')} Ft
                </span>
                <span className="block text-[11px] text-[#667085]">
                  {school.approvedBottleCount.toLocaleString('hu-HU')} db
                </span>
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex shrink-0 flex-wrap gap-3 items-center justify-between border-t border-slate-100 pt-4 text-xs text-[#667085]">
        <span>{result?.totalCount ?? 0} jóváhagyott eredmény</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            aria-label="Előző oldal"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            aria-label="Következő oldal"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
