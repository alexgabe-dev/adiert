'use client';

import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../../data/mockData';
import { StepIcon } from '../illustrations/StepIcons';

import { useModalActions } from '@/components/providers/ModalProvider';

export const HowItWorksSection: React.FC = () => {
  const { openGuide, openSubmit } = useModalActions();

  return (
    <section
      id="hogyan-mukodik"
      className="py-16 md:py-24 bg-[#F7F9FC] border-y border-[#E8ECF2]/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold tracking-wider uppercase mb-3.5">
            ÍGY MŰKÖDIK
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1535] tracking-tight mb-4">
            5 egyszerű lépés Ádiért
          </h2>
          <p className="text-base sm:text-lg text-[#667085]">
            A palackgyűjtéstől az iskolai pontszerzésig mindössze néhány perc az egész folyamat.
          </p>
        </div>

        {/* Desktop / Tablet Horizontal Visual Journey */}
        <div className="relative">
          {/* Subtle Connecting Line on Desktop */}
          <div className="hidden lg:block absolute top-16 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-slate-200 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.stepNumber}
                className="group bg-white rounded-2xl p-6 border border-[#E8ECF2] shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center relative"
              >
                {/* Step Number Tag */}
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-xs">
                  {step.stepNumber}
                </div>

                {/* Step Illustration */}
                <div className="mb-4">
                  <StepIcon type={step.iconType} size={54} />
                </div>

                {/* Short Category */}
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                  {step.shortLabel}
                </span>

                {/* Step Title */}
                <h3 className="text-base font-bold text-[#0B1535] mb-2 leading-snug">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-xs sm:text-[13px] text-[#667085] leading-relaxed mb-4 flex-1 font-normal">
                  {step.description}
                </p>

                {/* Highlight Badge */}
                <div className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{step.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Bottom CTA */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={openGuide}
            id="how-it-works-guide-btn"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm sm:text-base hover:underline underline-offset-4 cursor-pointer p-2"
          >
            <span>Részletes útmutató és tippek</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline text-slate-300">•</span>

          <button
            type="button"
            onClick={() => openSubmit()}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#0B1535] font-semibold text-sm px-4 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <span>Van már bizonylatod? Töltsd fel most</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>
      </div>
    </section>
  );
};
