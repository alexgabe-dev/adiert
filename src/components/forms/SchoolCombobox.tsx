'use client';

import { Check, ChevronsUpDown, LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type { SchoolSelection } from '@/features/public-data/types';

const RECENT_SCHOOL_KEY = 'adiert.recent-school-id';

interface SchoolComboboxProps {
  id?: string;
  campaignId: string;
  value: SchoolSelection | null;
  onChange: (school: SchoolSelection | null) => void;
  disabled?: boolean;
  rememberSelection?: boolean;
}

function isSearchResponse(value: unknown): value is { results: SchoolSelection[] } {
  if (!value || typeof value !== 'object') return false;
  const results = (value as { results?: unknown }).results;
  return (
    Array.isArray(results) &&
    results.every(
      (result) =>
        result &&
        typeof result.id === 'string' &&
        typeof result.name === 'string' &&
        typeof result.city === 'string' &&
        typeof result.county === 'string',
    )
  );
}

export function SchoolCombobox({
  id,
  campaignId,
  value,
  onChange,
  disabled,
  rememberSelection = true,
}: SchoolComboboxProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<SchoolSelection[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (value || disabled || !rememberSelection) return;
    const recentId = window.localStorage.getItem(RECENT_SCHOOL_KEY);
    if (!recentId) return;
    const controller = new AbortController();
    const parameters = new URLSearchParams({ campaign_id: campaignId, school_id: recentId });
    void fetch(`/api/schools/search?${parameters}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const body: unknown = await response.json();
        return isSearchResponse(body) ? (body.results[0] ?? null) : null;
      })
      .then((school) => {
        if (school) onChange(school);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [campaignId, disabled, onChange, value, rememberSelection]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!open || value || normalizedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setFailed(false);
      const parameters = new URLSearchParams({
        query: normalizedQuery,
        campaign_id: campaignId,
      });
      void fetch(`/api/schools/search?${parameters}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error('search');
          const body: unknown = await response.json();
          if (!isSearchResponse(body)) throw new Error('search');
          setResults(body.results);
          setActiveIndex(body.results.length > 0 ? 0 : -1);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setResults([]);
          setFailed(true);
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [campaignId, open, query, value]);

  const selectSchool = (school: SchoolSelection) => {
    onChange(school);
    setQuery(school.name);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    window.localStorage.setItem(RECENT_SCHOOL_KEY, school.id);
  };

  if (value) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#0B1535]">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{value.name}</span>
          </div>
          <div className="mt-0.5 text-xs text-[#667085]">
            {value.city} · {value.county}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery('');
            setOpen(true);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
          disabled={disabled}
          className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          aria-label="Másik iskola választása"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          value={query}
          disabled={disabled}
          placeholder="Keresd az iskola nevét vagy települést…"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, results.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter' && open && activeIndex >= 0) {
              event.preventDefault();
              const school = results[activeIndex];
              if (school) selectSchool(school);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
            }
          }}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-sm font-medium text-[#0B1535] focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400">
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-label="Keresés" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </div>

      {open && query.trim().length >= 2 ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          {!loading && results.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-[#667085]" role="status">
              {failed
                ? 'A keresés most nem érhető el. Próbáld újra.'
                : 'Nincs találat. Próbálj másik nevet vagy települést.'}
            </div>
          ) : null}
          {results.map((school, index) => (
            <button
              id={`${listboxId}-${index}`}
              key={school.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectSchool(school)}
              className={`block w-full rounded-lg px-3 py-2.5 text-left focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
                index === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-bold text-[#0B1535]">{school.name}</span>
              <span className="mt-0.5 block text-xs text-[#667085]">
                {school.city} · {school.county}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {open && query.trim().length > 0 && query.trim().length < 2 ? (
        <p className="mt-1.5 text-[11px] text-[#667085]">Írj be legalább 2 karaktert.</p>
      ) : null}
    </div>
  );
}
