'use client';

import { Search, Trophy, X } from 'lucide-react';
import React, { useState } from 'react';

import { ModalDialog } from '@/components/ui/ModalDialog';
import { INITIAL_SCHOOLS } from '@/data/mockData';

interface FullLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchool?: (schoolName: string) => void;
}

export const FullLeaderboardModal: React.FC<FullLeaderboardModalProps> = ({
  isOpen,
  onClose,
  onSelectSchool,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Mind');

  if (!isOpen) return null;

  const filtered = INITIAL_SCHOOLS.filter((school) => {
    const matchRegion = selectedRegion === 'Mind' || school.region === selectedRegion;
    const matchSearch =
      search === '' ||
      school.name.toLowerCase().includes(search.toLowerCase()) ||
      school.city.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

  return (
    <ModalDialog
      labelId="full-leaderboard-title"
      onClose={onClose}
      className="flex max-h-[92vh] max-w-3xl flex-col rounded-3xl p-6 sm:p-8"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-700 uppercase">
            <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span>Országos Bajnokság</span>
          </div>
          <h3
            id="full-leaderboard-title"
            className="mt-1 text-xl font-extrabold text-[#0B1535] sm:text-2xl"
          >
            Teljes Iskolai Ranglista
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-autofocus
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Bezárás"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="relative sm:col-span-8">
          <Search
            className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="leaderboard-search" className="sr-only">
            Keresés iskola vagy város neve alapján
          </label>
          <input
            id="leaderboard-search"
            type="search"
            placeholder="Keresés iskola vagy város neve alapján..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs text-[#0B1535] focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
          />
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="leaderboard-region" className="sr-only">
            Régió szűrése
          </label>
          <select
            id="leaderboard-region"
            value={selectedRegion}
            onChange={(event) => setSelectedRegion(event.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-[#0B1535] focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
          >
            <option value="Mind">Minden régió</option>
            <option value="Budapest">Budapest</option>
            <option value="Pest megye">Pest megye</option>
            <option value="Dunántúl">Dunántúl</option>
            <option value="Kelet-Magyarország">Kelet-Magyarország</option>
          </select>
        </div>
      </div>

      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto pr-1">
        {filtered.length > 0 ? (
          filtered.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => {
                onSelectSchool?.(school.name);
                onClose();
              }}
              className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              aria-label={`${school.name} kiválasztása beküldéshez`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                    school.rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-2xs'
                      : school.rank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : school.rank === 3
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {school.rank}.
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-[#0B1535] transition-colors group-hover:text-blue-600 sm:text-sm">
                    {school.name}
                  </span>
                  <span className="flex items-center gap-2 text-[11px] text-[#667085]">
                    <span>{school.city}</span>
                    <span>•</span>
                    <span>{school.region}</span>
                    <span>•</span>
                    <span>{school.type}</span>
                  </span>
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block text-xs font-extrabold text-[#0B1535] sm:text-sm">
                  {school.totalAmount.toLocaleString('hu-HU')} Ft
                </span>
                <span className="block text-[11px] text-[#667085]">
                  {school.bottlesCount.toLocaleString('hu-HU')} db
                </span>
              </span>
            </button>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-[#667085] sm:text-sm">
            Nincs találat a keresési feltételek alapján.
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-[#667085]">
        <span>Összesen {filtered.length} iskola listázva</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-[#0B1535] transition-colors hover:bg-slate-200"
        >
          Bezárás
        </button>
      </div>
    </ModalDialog>
  );
};
