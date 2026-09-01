'use client';

import React, { useState } from 'react';
import { Check, Clock3, Share2 } from 'lucide-react';
import { QrCodeGraphic } from '../illustrations/QrCodeGraphic';
import { MascotBottle } from '../illustrations/MascotBottle';

export const QrCodeCtaSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="iskolaknak" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Contained Blue → Green Gradient Canvas */}
      <div className="relative rounded-3xl md:rounded-[36px] bg-gradient-to-br from-[#246BFD] via-[#1E5AD6] to-[#1E8E3E] text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-lg">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold tracking-wider uppercase mb-5">
              <span>GYORS ADOMÁNYOZÁS</span>
              <span>📱</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Használd az Ádiért QR-kódot!
            </h2>

            <p className="text-base sm:text-lg text-blue-50 leading-relaxed max-w-xl mb-8 font-normal">
              Olvasd be a kódot a REpont automatánál a visszaváltás megkezdésekor, így a
              visszaváltási díj (50 Ft / palack) közvetlenül Ádi támogatását segíti.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-8">
              <button
                type="button"
                disabled
                id="download-qr-btn"
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-white/90 px-6 py-3.5 text-sm font-extrabold text-[#0B1535] shadow-md sm:text-base"
                aria-describedby="qr-placeholder-note"
              >
                <Clock3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <span>Hivatalos QR hamarosan</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-sm sm:text-base px-5 py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Link másolva</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Megosztás</span>
                  </>
                )}
              </button>
            </div>

            {/* Mascot bottle standing subtly alongside copy */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/20">
              <MascotBottle size={42} expression="excited" />
              <div className="text-xs text-blue-100 font-medium">
                A hivatalos kód érkezése után innen mentheted majd le vagy nyomtathatod ki.
              </div>
            </div>
          </div>

          {/* Right Column: High-Visibility QR Code Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative group">
              {/* QR Code Container */}
              <div className="p-3 sm:p-4 bg-white rounded-3xl shadow-xl transition-transform duration-300 group-hover:scale-102">
                <div
                  role="img"
                  aria-label="Helyőrző az érkező hivatalos Ádiért REpont QR-kód számára"
                >
                  <QrCodeGraphic size={240} />
                </div>
                <div className="mt-3 text-center">
                  <div className="text-xs font-black tracking-wider text-[#0B1535] uppercase">
                    ÁDIÉRT • REPONT QR HELYŐRZŐ
                  </div>
                  <div id="qr-placeholder-note" className="text-[11px] text-[#667085]">
                    A hivatalos, használható kód még nem érkezett meg
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 15. TRUST ELEMENTS - Below the QR CTA */}
      <div className="mt-10 pt-6 border-t border-slate-200/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#0B1535]">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Ellenőrzött gyűjtések</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#0B1535]">
            <span className="text-blue-600">🛡</span>
            <span>Átlátható rendszer</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#0B1535]">
            <span>♻️</span>
            <span>Minden palack számít</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#0B1535]">
            <span className="text-blue-600">💙</span>
            <span>Együtt Ádiért</span>
          </div>
        </div>
      </div>
    </section>
  );
};
