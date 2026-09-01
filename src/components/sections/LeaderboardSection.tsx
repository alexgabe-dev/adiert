'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Minus,
  School as SchoolIcon,
  Trophy,
} from 'lucide-react';
import { INITIAL_SCHOOLS } from '../../data/mockData';
import { SchoolPodiumIllustration } from '../illustrations/SchoolPodiumIllustration';

import { useModalActions } from '@/components/providers/ModalProvider';

export const LeaderboardSection: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('Országos');
  const [selectedType, setSelectedType] = useState<string>('Összes iskola');
  const searchQuery = '';
  const { openLeaderboard, openSubmit } = useModalActions();

  const filteredSchools = useMemo(() => {
    return INITIAL_SCHOOLS.filter((school) => {
      const matchRegion = selectedRegion === 'Országos' || school.region === selectedRegion;
      const matchType = selectedType === 'Összes iskola' || school.type === selectedType;
      const matchSearch =
        searchQuery.trim() === '' ||
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchType && matchSearch;
    });
  }, [selectedRegion, selectedType, searchQuery]);

  // Top 3 Podium and 4-7 list
  const top1 = filteredSchools.find((s) => s.rank === 1) || filteredSchools[0];
  const top2 = filteredSchools.find((s) => s.rank === 2) || filteredSchools[1];
  const top3 = filteredSchools.find((s) => s.rank === 3) || filteredSchools[2];
  const remainingSchools = filteredSchools.slice(3, 7);

  const renderRankDiff = (current: number, prev: number) => {
    if (prev > current) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
          <ArrowUp className="w-3 h-3 stroke-[3]" />
          <span>{prev - current}</span>
        </span>
      );
    }
    if (prev < current) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
          <ArrowDown className="w-3 h-3 stroke-[3]" />
          <span>{current - prev}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-semibold text-slate-400">
        <Minus className="w-3 h-3" />
      </span>
    );
  };

  return (
    <section id="ranglista" className="py-16 md:py-24 bg-[#F7F9FC] border-y border-[#E8ECF2]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-bold tracking-wider uppercase mb-3">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>RANGLISTA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1535] tracking-tight">
              Top iskolák
            </h2>
            <p className="text-sm sm:text-base text-[#667085] mt-1">
              Kövesd élőben a palackgyűjtő bajnokság állását!
            </p>
          </div>

          {/* Interactive Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Region Filter */}
            <div className="relative">
              <select
                aria-label="Régió szűrés"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-white border border-slate-200 text-[#0B1535] text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="Országos">Országos ▾</option>
                <option value="Budapest">Budapest</option>
                <option value="Pest megye">Pest megye</option>
                <option value="Dunántúl">Dunántúl</option>
                <option value="Kelet-Magyarország">Kelet-Magyarország</option>
              </select>
            </div>

            {/* School Type Filter */}
            <div className="relative">
              <select
                aria-label="Iskolatípus szűrés"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-white border border-slate-200 text-[#0B1535] text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="Összes iskola">Összes iskola ▾</option>
                <option value="Általános iskola">Általános iskola</option>
                <option value="Gimnázium">Gimnázium</option>
                <option value="Technikum">Technikum</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid: TOP 3 Podium + Positions 4-7 List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Podium for TOP 3 (7 Cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-end">
              {/* 2nd Place (Silver) */}
              {top2 && (
                <button
                  type="button"
                  onClick={() => openSubmit(top2.name)}
                  className="order-1 flex w-full flex-col items-center rounded-2xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-5"
                  aria-label={`${top2.name} kiválasztása beküldéshez`}
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-extrabold text-sm mb-2">
                    2.
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    🥈 Ezüst
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-[#0B1535] mb-2 line-clamp-2 h-9 sm:h-10 flex items-center">
                    {top2.name}
                  </h4>
                  <div className="text-sm sm:text-base font-extrabold text-[#0B1535] mb-0.5">
                    {top2.totalAmount.toLocaleString('hu-HU')} Ft
                  </div>
                  <div className="text-[11px] text-[#667085] mb-3">
                    {top2.bottlesCount.toLocaleString('hu-HU')} db
                  </div>
                  <div className="mt-auto w-full pt-2 border-t border-slate-100 flex flex-col items-center">
                    {renderRankDiff(top2.rank, top2.previousRank)}
                    <div className="mt-2 w-full">
                      <SchoolPodiumIllustration rank={2} />
                    </div>
                  </div>
                </button>
              )}

              {/* 1st Place (Gold Trophy - Highlighted center) */}
              {top1 && (
                <button
                  type="button"
                  onClick={() => openSubmit(top1.name)}
                  className="relative z-10 order-2 -mt-4 flex w-full flex-col items-center rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/70 to-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-6"
                  aria-label={`${top1.name} kiválasztása beküldéshez`}
                >
                  <div className="absolute -top-3.5 bg-amber-400 text-amber-950 text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <span>👑 Bajnok</span>
                  </div>

                  <div className="w-11 h-11 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-base mb-2 shadow-xs">
                    1.
                  </div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
                    🥇 Arany trófea
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-[#0B1535] mb-2 line-clamp-2 h-10 sm:h-11 flex items-center">
                    {top1.name}
                  </h4>
                  <div className="text-base sm:text-xl font-black text-blue-600 mb-0.5">
                    {top1.totalAmount.toLocaleString('hu-HU')} Ft
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mb-3 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {top1.bottlesCount.toLocaleString('hu-HU')} palack
                  </div>
                  <div className="mt-auto w-full pt-2 border-t border-amber-100 flex flex-col items-center">
                    {renderRankDiff(top1.rank, top1.previousRank)}
                    <div className="mt-2 w-full">
                      <SchoolPodiumIllustration rank={1} />
                    </div>
                  </div>
                </button>
              )}

              {/* 3rd Place (Bronze) */}
              {top3 && (
                <button
                  type="button"
                  onClick={() => openSubmit(top3.name)}
                  className="order-3 flex w-full flex-col items-center rounded-2xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-5"
                  aria-label={`${top3.name} kiválasztása beküldéshez`}
                >
                  <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-extrabold text-sm mb-2">
                    3.
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                    🥉 Bronz
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-[#0B1535] mb-2 line-clamp-2 h-9 sm:h-10 flex items-center">
                    {top3.name}
                  </h4>
                  <div className="text-sm sm:text-base font-extrabold text-[#0B1535] mb-0.5">
                    {top3.totalAmount.toLocaleString('hu-HU')} Ft
                  </div>
                  <div className="text-[11px] text-[#667085] mb-3">
                    {top3.bottlesCount.toLocaleString('hu-HU')} db
                  </div>
                  <div className="mt-auto w-full pt-2 border-t border-slate-100 flex flex-col items-center">
                    {renderRankDiff(top3.rank, top3.previousRank)}
                    <div className="mt-2 w-full">
                      <SchoolPodiumIllustration rank={3} />
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Positions 4–7 Compact Leaderboard List (5 Cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-2xl p-5 border border-[#E8ECF2] shadow-xs flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                  Pozíció 4 – 7.
                </span>
                <span className="text-xs text-blue-600 font-medium">{selectedRegion}</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-around">
                {remainingSchools.map((school) => (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => openSubmit(school.name)}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    aria-label={`${school.name} kiválasztása beküldéshez`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Number */}
                      <span className="font-extrabold text-sm text-[#0B1535] w-5 text-center">
                        {school.rank}.
                      </span>

                      {/* Mini School Avatar */}
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <SchoolIcon className="w-4 h-4" />
                      </div>

                      {/* School Name & City */}
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs sm:text-sm text-[#0B1535] truncate group-hover:text-blue-600 transition-colors">
                          {school.name}
                        </h5>
                        <span className="text-[11px] text-[#667085]">
                          {school.city} • {school.type}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Change */}
                    <div className="text-right shrink-0 flex items-center gap-2.5">
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-[#0B1535]">
                          {school.totalAmount.toLocaleString('hu-HU')} Ft
                        </div>
                        <div className="text-[11px] text-[#667085]">
                          {school.bottlesCount.toLocaleString('hu-HU')} db
                        </div>
                      </div>
                      {renderRankDiff(school.rank, school.previousRank)}
                    </div>
                  </button>
                ))}
              </div>

              {/* CTA to Open Full Leaderboard Modal */}
              <div className="pt-4 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={openLeaderboard}
                  id="view-full-leaderboard-btn"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 text-[#0B1535] font-bold text-sm py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  <span>Teljes ranglista megtekintése</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
