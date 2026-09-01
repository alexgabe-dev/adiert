'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQS } from '../../data/mockData';

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="gyik" className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold tracking-wider uppercase mb-3.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
          <span>GYAKORI KÉRDÉSEK</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1535] tracking-tight mb-3">
          Gyakran Ismételt Kérdések
        </h2>
        <p className="text-base text-[#667085]">
          Minden fontos tudnivaló diákoknak, szülőknek és tanároknak a gyűjtésről.
        </p>
      </div>

      {/* Accordion Container */}
      <div className="space-y-3.5">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-white border-blue-200 shadow-xs'
                  : 'bg-white/80 border-[#E8ECF2] hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-bold text-[#0B1535]">
                  {faq.question}
                </span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#667085] leading-relaxed border-t border-slate-100 mt-1">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center text-xs text-[#667085]">
        További kérdésed van? Írj nekünk bátran az{' '}
        <a href="mailto:info@adiert.hu" className="text-blue-600 font-semibold hover:underline">
          info@adiert.hu
        </a>{' '}
        címre.
      </div>
    </section>
  );
};
