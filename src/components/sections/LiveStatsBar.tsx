import React from 'react';
import { Coins, Recycle, School as SchoolIcon, Target } from 'lucide-react';
import { CAMPAIGN_STATS } from '../../data/mockData';

export const LiveStatsBar: React.FC = () => {
  return (
    <section className="relative z-10 -mt-2 sm:-mt-4 mb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        id="campaign-stats-container"
        className="bg-white rounded-2xl md:rounded-3xl border border-[#E8ECF2] shadow-sm p-5 sm:p-7 md:p-8"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-100">
          {/* Stat 1: Összegyűjtött összeg */}
          <div className="flex flex-col space-y-1.5 lg:px-6 first:lg:pl-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#667085] uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <span>Összegyűjtött összeg</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1535] tracking-tight">
              {CAMPAIGN_STATS.formattedAmount}
            </div>
            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span>↑ 100% Ádi kezelésére</span>
            </div>
          </div>

          {/* Stat 2: Visszaváltott palackok */}
          <div className="flex flex-col space-y-1.5 lg:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#667085] uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Recycle className="w-4 h-4" />
              </div>
              <span>Visszaváltott palackok</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1535] tracking-tight">
              {CAMPAIGN_STATS.formattedBottles}
            </div>
            <div className="text-xs text-[#667085]">PET palack és aludoboz</div>
          </div>

          {/* Stat 3: Résztvevő iskolák */}
          <div className="flex flex-col space-y-1.5 lg:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#667085] uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <SchoolIcon className="w-4 h-4" />
              </div>
              <span>Résztvevő iskolák</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1535] tracking-tight">
              {CAMPAIGN_STATS.participatingSchools}
            </div>
            <div className="text-xs text-blue-600 font-medium">Országszerte versenyezve</div>
          </div>

          {/* Stat 4: Kampány célja with Progress Bar */}
          <div className="flex flex-col space-y-2 lg:px-6 last:lg:pr-0">
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#667085] uppercase tracking-wider">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <span>Kampány célja</span>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {CAMPAIGN_STATS.progressPercentage}% elérve
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1535] tracking-tight">
              {CAMPAIGN_STATS.formattedGoal}
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${CAMPAIGN_STATS.progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={CAMPAIGN_STATS.progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
