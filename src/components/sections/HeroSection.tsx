import React from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { HeroRecyclingScene } from '../illustrations/HeroRecyclingScene';

interface HeroSectionProps {
  participatingSchoolCount: number;
  dataAvailable: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  participatingSchoolCount,
  dataAvailable,
}) => {
  return (
    <section id="rolunk" className="relative pt-28 pb-14 md:pt-36 md:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-5">
              <span>PALACKBÓL SEGÍTSÉG</span>
              <span className="text-sm">♻️</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold text-[#0B1535] leading-[1.12] tracking-tight mb-5">
              Minden palack számít. <span className="text-blue-600 block sm:inline">Ádiért.</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-lg sm:text-xl text-[#667085] leading-relaxed max-w-2xl mb-8 font-normal">
              Váltsd vissza a palackokat az Ádiért QR-kóddal, fotózd le a bizonylatot, és segíts az
              iskoládnak feljebb jutni az országos ranglistán.
            </p>

            {/* CTAs */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
              <a
                href="#hogyan-mukodik"
                id="hero-how-it-works-btn"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-6 py-3.5 rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center"
              >
                <span>Hogyan működik?</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </a>

              <a
                href="#ranglista"
                id="hero-leaderboard-btn"
                className="inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0B1535] font-semibold text-base px-6 py-3.5 rounded-xl transition-colors duration-150 cursor-pointer text-center"
              >
                <Trophy className="w-4.5 h-4.5 text-amber-500" />
                <span>Nézd meg a ranglistát</span>
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 w-full max-w-lg">
              {/* Playful School Avatars */}
              <div className="flex -space-x-2 overflow-hidden">
                <div
                  className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs shadow-xs"
                  title="Résztvevő iskola"
                >
                  🏫
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs shadow-xs"
                  title="Résztvevő iskola"
                >
                  🎒
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-xs shadow-xs"
                  title="Résztvevő iskola"
                >
                  📚
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-xs shadow-xs"
                  title="Résztvevő iskola"
                >
                  ✏️
                </div>
              </div>

              <div className="text-xs sm:text-sm text-[#0B1535] font-semibold flex items-center gap-1.5">
                <span className="text-blue-600 font-extrabold">
                  {participatingSchoolCount.toLocaleString('hu-HU')} iskola
                </span>
                <span className="text-[#667085] font-normal">
                  {dataAvailable ? 'vesz részt az aktív kampányban' : '— az élő adat nem elérhető'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual System Illustration */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <HeroRecyclingScene />
          </div>
        </div>
      </div>
    </section>
  );
};
