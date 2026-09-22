'use client';

import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Building2,
  Receipt,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { useModalActions } from '@/components/providers/ModalProvider';

export const ReceiptVerificationDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState<'reviewing' | 'approved'>('reviewing');
  const shouldReduceMotion = useReducedMotion();
  const { openSubmit } = useModalActions();

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Copy & Trust Info */}
        <div className="lg:col-span-6 flex flex-col items-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-bold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>MINTA FOLYAMAT · KÉZI ELLENŐRZÉS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1535] tracking-tight mb-4">
            Fotózd le. Mi ellenőrizzük.
          </h2>

          <p className="text-base sm:text-lg text-[#667085] leading-relaxed mb-6 font-normal">
            Még a fizetés előtt fotózd le az automata képernyőjét úgy, hogy a visszaváltott
            darabszám jól olvasható legyen. A képet az iskolához feltöltve küldheted be
            ellenőrzésre. Az illusztráció mintát mutat.
          </p>

          {/* Quick interactive stepper toggles */}
          <div className="grid grid-cols-2 w-full items-center gap-2 p-1.5 bg-slate-100/80 rounded-xl mb-6 border border-slate-200/60">
            <button
              type="button"
              aria-pressed={activeStep === 'reviewing'}
              onClick={() => setActiveStep('reviewing')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeStep === 'reviewing'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-[#667085] hover:text-[#0B1535]'
              }`}
            >
              1. Ellenőrzés alatt
            </button>
            <button
              type="button"
              aria-pressed={activeStep === 'approved'}
              onClick={() => setActiveStep('approved')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeStep === 'approved'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-[#667085] hover:text-[#0B1535]'
              }`}
            >
              2. Elfogadva ✓
            </button>
          </div>

          <div className="space-y-3.5 mb-8 w-full max-w-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                ✓
              </div>
              <p className="text-sm text-[#0B1535]">
                <strong className="font-semibold">A fotó nem nyilvános:</strong> csak az iskolád
                csapata és az ellenőrzők láthatják.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                ✓
              </div>
              <p className="text-sm text-[#0B1535]">
                <strong className="font-semibold">Átlátható jóváírás:</strong> minden forint és
                palack tételesen megjelenik az iskola elszámolásában.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openSubmit()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Képernyőfotó feltöltése</span>
          </button>
        </div>

        {/* Right Side: Simplified Mobile UI Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 border border-[#E8ECF2] shadow-md relative overflow-hidden">
            {/* Phone Top Notch Bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between pb-4 mb-4 border-b border-slate-100 text-xs text-[#667085]">
              <div className="flex items-center gap-1.5 font-bold text-[#0B1535]">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Képernyőfotó előnézete</span>
              </div>
              <span className="font-mono text-[11px]">#REP-84920</span>
            </div>

            {/* Receipt Preview Card Inside Mockup */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5 relative">
              <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  📸 Képernyőfotó feltöltve
                </span>
                <span className="text-[11px] font-mono text-slate-400">2026.03.02 • 14:28</span>
              </div>

              {/* Amount & Bottle count */}
              <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-dashed border-slate-200">
                <div>
                  <div className="text-2xl font-black text-[#0B1535]">2 500 Ft</div>
                  <div className="text-xs text-blue-600 font-semibold">50 palack visszaváltva</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-blue-700 flex items-center justify-center font-bold text-xs">
                  50×
                </div>
              </div>

              {/* School Tag */}
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1535]">
                <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">Kossuth Lajos Általános Iskola</span>
              </div>
            </div>

            {/* Live State Animation Container */}
            <AnimatePresence mode="wait">
              {activeStep === 'reviewing' ? (
                <motion.div
                  key="reviewing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center animate-spin-slow">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        Állapot:
                      </div>
                      <div className="text-sm font-extrabold text-amber-950">
                        Ellenőrzés alatt...
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-1 rounded-md">
                    Minta
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="approved"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                  className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Állapot: Elfogadva ✓
                      </div>
                      <div className="text-sm font-extrabold text-emerald-950 flex items-center gap-1">
                        <span>+50 palack az iskola eredményéhez</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-full">
                    Jóváírva
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Status Caption */}
            <div className="text-center mt-4">
              <span className="text-[11px] text-[#667085]">
                Az eredmény csak adminisztrátori jóváhagyás után változik
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
