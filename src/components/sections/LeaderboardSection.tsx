'use client';

import { ChevronRight, School as SchoolIcon, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { SchoolPodiumIllustration } from '@/components/illustrations/SchoolPodiumIllustration';
import { useModalActions } from '@/components/providers/ModalProvider';
import type { LeaderboardSchool } from '@/features/public-data/types';
import { schoolTypeLabels } from '@/features/public-data/types';

interface LeaderboardSectionProps {
  schools: LeaderboardSchool[];
  dataAvailable: boolean;
}

function PodiumCard({ school, children }: { school: LeaderboardSchool; children: ReactNode }) {
  const { openSubmit } = useModalActions();
  const rankStyles = {
    1: 'relative z-10 order-2 -mt-4 border-2 border-amber-300 bg-gradient-to-b from-amber-50/70 to-white p-4 sm:p-6',
    2: 'order-1 border border-slate-200 bg-white p-3.5 sm:p-5',
    3: 'order-3 border border-slate-200 bg-white p-3.5 sm:p-5',
  } as const;

  return (
    <button
      type="button"
      onClick={() => openSubmit(school)}
      className={`flex w-full flex-col items-center rounded-2xl text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none ${rankStyles[school.rank as 1 | 2 | 3]}`}
      aria-label={`${school.name} kiválasztása beküldéshez`}
    >
      {school.rank === 1 ? (
        <div className="absolute -top-3.5 rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-extrabold text-amber-950 shadow-xs">
          👑 Bajnok
        </div>
      ) : null}
      <div
        className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full font-extrabold ${
          school.rank === 1
            ? 'bg-amber-400 text-amber-950'
            : school.rank === 2
              ? 'border border-slate-300 bg-slate-100 text-slate-700'
              : 'border border-amber-300 bg-amber-100 text-amber-900'
        }`}
      >
        {school.rank}.
      </div>
      {children}
      <h4 className="mb-2 flex h-10 items-center text-xs font-bold text-[#0B1535] sm:text-sm">
        <span className="line-clamp-2">{school.name}</span>
      </h4>
      <div className="text-sm font-extrabold text-[#0B1535] sm:text-base">
        {school.approvedAmount.toLocaleString('hu-HU')} Ft
      </div>
      <div className="mb-3 text-[11px] text-[#667085]">
        {school.approvedBottleCount.toLocaleString('hu-HU')} db
      </div>
      <div className="mt-auto w-full border-t border-slate-100 pt-2">
        <SchoolPodiumIllustration rank={school.rank as 1 | 2 | 3} />
      </div>
    </button>
  );
}

export function LeaderboardSection({ schools, dataAvailable }: LeaderboardSectionProps) {
  const { openLeaderboard, openSubmit } = useModalActions();
  const podium = schools.filter((school) => school.rank <= 3);
  const remaining = schools.filter((school) => school.rank > 3).slice(0, 4);

  return (
    <section id="ranglista" className="border-y border-[#E8ECF2]/60 bg-[#F7F9FC] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-xs font-bold tracking-wider text-amber-800 uppercase">
              <Trophy className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              <span>Ranglista</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0B1535] sm:text-4xl">
              Top iskolák
            </h2>
            <p className="mt-1 text-sm text-[#667085] sm:text-base">
              Kizárólag jóváhagyott képernyőfotók alapján, determinisztikus országos sorrendben.
            </p>
          </div>
        </div>

        {!dataAvailable ? (
          <div className="rounded-2xl border border-[#E8ECF2] bg-white px-6 py-12 text-center text-sm text-[#667085]">
            A ranglista átmenetileg nem érhető el.
          </div>
        ) : schools.length === 0 ? (
          <div className="rounded-2xl border border-[#E8ECF2] bg-white px-6 py-12 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-amber-400" aria-hidden="true" />
            <h3 className="font-bold text-[#0B1535]">Még nincs jóváhagyott ranglistaeredmény</h3>
            <p className="mt-1 text-sm text-[#667085]">
              Az első ellenőrzött képernyőfotó jóváhagyása után itt jelenik meg a sorrend.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            <div className="flex flex-col justify-between lg:col-span-7">
              <div className="grid grid-cols-1 items-end gap-4 min-[430px]:grid-cols-3">
                {podium.map((school) => (
                  <PodiumCard key={school.id} school={school}>
                    <span className="mb-1 text-[10px] font-bold tracking-wide text-slate-500 uppercase sm:text-xs">
                      {school.rank === 1 ? '🥇 Arany' : school.rank === 2 ? '🥈 Ezüst' : '🥉 Bronz'}
                    </span>
                  </PodiumCard>
                ))}
              </div>
            </div>

            <div className="flex flex-col lg:col-span-5">
              <div className="flex flex-1 flex-col justify-between rounded-2xl border border-[#E8ECF2] bg-white p-5 shadow-xs">
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold tracking-wider text-[#667085] uppercase">
                    További helyezések
                  </span>
                  <span className="text-xs font-medium text-blue-600">Országos</span>
                </div>
                <div className="flex-1 divide-y divide-slate-100">
                  {remaining.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => openSubmit(school)}
                      className="group flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="w-6 text-center text-sm font-extrabold text-[#0B1535]">
                          {school.rank}.
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <SchoolIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-[#0B1535] group-hover:text-blue-600 sm:text-sm">
                            {school.name}
                          </span>
                          <span className="block truncate text-[11px] text-[#667085]">
                            {school.city} · {schoolTypeLabels[school.type]}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs font-extrabold text-[#0B1535] sm:text-sm">
                          {school.approvedAmount.toLocaleString('hu-HU')} Ft
                        </span>
                        <span className="block text-[11px] text-[#667085]">
                          {school.approvedBottleCount.toLocaleString('hu-HU')} db
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={openLeaderboard}
                    id="view-full-leaderboard-btn"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-[#0B1535] transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <span>Teljes ranglista megtekintése</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
