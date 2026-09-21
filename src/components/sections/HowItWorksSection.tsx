'use client';
import { ArrowRight } from 'lucide-react';
import { useModalActions } from '@/components/providers/ModalProvider';
import { ReturnMethods } from './ReturnMethods';

export function HowItWorksSection() {
  const { openGuide, openSubmit, openRegister } = useModalActions();
  return (
    <section id="hogyan-mukodik" className="border-y border-slate-200 bg-[#F7F9FC] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold tracking-widest text-blue-600 uppercase">
            Palack-visszaváltás lépésről lépésre
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Kétféle automata. Egy közös cél.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            A helyes sorrenddel a visszaváltási díj Ádit támogatja, a lefotózott darabszám pedig az
            iskolai gyűjtés ellenőrzését segíti.
          </p>
        </div>
        <ReturnMethods />
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={openRegister}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold"
          >
            Iskolai regisztráció
          </button>
          <button
            type="button"
            id="how-it-works-guide-btn"
            onClick={openGuide}
            className="px-5 py-3 text-sm font-bold text-blue-600 hover:underline"
          >
            Útmutató a weboldal használatához
          </button>
          <button
            type="button"
            onClick={() => openSubmit()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Képernyőfotó feltöltése <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
