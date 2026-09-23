'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Calculator, CheckCircle, Sparkles } from 'lucide-react';

interface GamificationTeaserProps {
  approvedBottleCount: number;
  dataAvailable: boolean;
}

export const GamificationTeaser: React.FC<GamificationTeaserProps> = ({
  approvedBottleCount,
  dataAvailable,
}) => {
  const [calculatorBottles, setCalculatorBottles] = useState<number>(100);

  const milestones = [
    { target: 10_000, label: '10 000 db' },
    { target: 25_000, label: '25 000 db' },
    { target: 50_000, label: '50 000 db' },
    { target: 100_000, label: '100 000 db' },
  ].map((milestone) => ({
    ...milestone,
    completed: dataAvailable && approvedBottleCount >= milestone.target,
  }));

  const calculatedAmount = calculatorBottles * 50;

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/70 text-purple-800 text-xs font-bold tracking-wider uppercase mb-3.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>A GYŰJTÉS EREDMÉNYE</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1535] tracking-tight mb-3">
          Minden palack közelebb visz
        </h2>
        <p className="text-base sm:text-lg text-[#667085]">
          Kövesd az ellenőrzött képernyőfotókból számított országos gyűjtési mérföldköveket.
        </p>
      </div>

      {/* Visual Milestone Track: 10k → 25k → 50k → 100k bottles */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8ECF2] shadow-xs mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">
            Országos Kampány Mérföldkövek
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
            {dataAvailable
              ? `${approvedBottleCount.toLocaleString('hu-HU')} db jóváhagyva`
              : 'Az élő adat átmenetileg nem elérhető'}
          </span>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-4 gap-4 relative">
          {milestones.map((item) => (
            <div
              key={item.target}
              className={`p-4 rounded-2xl border transition-all ${
                item.completed
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white shadow-2xs">
                  {item.target >= 1000 ? `${item.target / 1000}k` : item.target}
                </span>
                {item.completed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">Még előttünk</span>
                )}
              </div>
              <div className="text-lg font-extrabold mb-1">{item.label}</div>
              <div className="text-xs text-[#667085]">
                {item.completed ? 'Igazolt országos mérföldkő' : 'Még nincs elérve'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Achievement Badges Showcase + Interactive Impact Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Verified campaign status */}
        <div className="lg:col-span-7">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#667085] mb-4">
            Ellenőrzött kampányeredmény
          </h3>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8">
            <div className="text-3xl font-black text-emerald-700 sm:text-4xl">
              {dataAvailable
                ? `${approvedBottleCount.toLocaleString('hu-HU')} db`
                : 'Az adat most nem elérhető'}
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#667085]">
              Az összesítésben a jóváhagyott gyűjtések szerepelnek. Az ellenőrzésre váró beküldések
              később kerülnek hozzá.
            </p>
          </div>
          <Image
            src="/pics/palack2.png"
            alt="Összegyűjtött palackok egy kék gyűjtőben, az iskola előtt"
            width={1536}
            height={1024}
            sizes="(min-width: 640px) 512px, calc(100vw - 32px)"
            className="mx-auto mt-6 block h-auto w-full max-w-lg object-contain"
          />
        </div>

        {/* Right: Interactive School / Class Calculator */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-50/80 to-slate-50 rounded-3xl p-6 border border-blue-100 shadow-xs">
          <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>Kalkulátor</span>
          </div>

          <h3 className="text-xl font-extrabold text-[#0B1535] mb-2">
            Mennyit ér az osztály gyűjtése?
          </h3>
          <p className="text-xs text-[#667085] mb-5">Hány palackot tudtok összegyűjteni a héten?</p>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-[#0B1535]">Palackok száma:</span>
              <span className="text-xl font-extrabold text-blue-600 font-mono">
                {calculatorBottles} db
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={calculatorBottles}
              onChange={(e) => setCalculatorBottles(Number(e.target.value))}
              aria-label="Palackok száma csúszka"
              className="impact-slider w-full cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-[11px] text-[#667085] font-mono">
              <span>10 db</span>
              <span>250 db</span>
              <span>500 db</span>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-2xs">
            <div className="text-xs font-semibold text-[#667085] mb-1">
              Becsült visszaváltási érték:
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              +{calculatedAmount.toLocaleString('hu-HU')} Ft
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">
              {calculatorBottles} palack × 50 Ft
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
