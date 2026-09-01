'use client';

import React, { useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, Upload, X } from 'lucide-react';
import { INITIAL_SCHOOLS } from '../../data/mockData';

import { ModalDialog } from '@/components/ui/ModalDialog';
import { launchConfetti } from '@/lib/confetti';

interface SubmitReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSchool?: string;
  onSubmittedSuccess?: (submission: {
    schoolName: string;
    amount: number;
    bottles: number;
  }) => void;
}

export const SubmitReceiptModal: React.FC<SubmitReceiptModalProps> = ({
  isOpen,
  onClose,
  defaultSchool = '',
  onSubmittedSuccess,
}) => {
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [selectedSchool, setSelectedSchool] = useState<string>(
    defaultSchool || INITIAL_SCHOOLS[0]?.name || '',
  );
  const [bottleCount, setBottleCount] = useState<number>(50);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');

  if (!isOpen) return null;

  const totalAmount = bottleCount * 50;

  const handleSimulateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseDemoReceipt = () => {
    // Quick fill with demo receipt
    setReceiptImage('demo');
    setBottleCount(60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('submitting');

    setTimeout(() => {
      setStep('success');
      void launchConfetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#246BFD', '#34C759', '#FFB020'],
      });

      if (onSubmittedSuccess) {
        onSubmittedSuccess({
          schoolName: selectedSchool,
          amount: totalAmount,
          bottles: bottleCount,
        });
      }
    }, 1200);
  };

  return (
    <ModalDialog
      labelId="submit-receipt-title"
      descriptionId="submit-receipt-description"
      onClose={onClose}
      className="max-h-[92vh] max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8"
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        data-autofocus
        className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Bezárás"
      >
        <X className="w-5 h-5" />
      </button>

      {step === 'form' && (
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            <Camera className="w-4 h-4" />
            <span>Gyűjtés beküldése</span>
          </div>

          <h3 id="submit-receipt-title" className="text-2xl font-extrabold text-[#0B1535] mb-2">
            Bizonylat feltöltése
          </h3>
          <p id="submit-receipt-description" className="text-xs sm:text-sm text-[#667085] mb-6">
            Fotózd le a REpont bizonylatot, és add hozzá a gyűjtést az iskoládhoz!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload Area */}
            <div>
              <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                REpont bizonylat fotója <span className="text-rose-500">*</span>
              </label>

              {receiptImage ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      📸
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Bizonylat csatolva</div>
                      <div className="text-[11px] text-emerald-700">
                        REpont automata #8492 • Érvényes
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Módosítás
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    id="receipt-file-input"
                    accept="image/*"
                    onChange={handleSimulateFile}
                    className="hidden"
                  />
                  <label
                    htmlFor="receipt-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#0B1535]">
                      Kattints a fotó kiválasztásához vagy készítéséhez
                    </span>
                    <span className="text-[11px] text-[#667085] mt-0.5">
                      JPG, PNG, HEIC (max 10MB)
                    </span>
                  </label>

                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={handleUseDemoReceipt}
                      className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>⚡ Gyors kitöltés mintabizonylattal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* School Selector */}
            <div>
              <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                Iskola kiválasztása <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1535] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {INITIAL_SCHOOLS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                  <option value="Egyéb / Új iskola">+ Másik iskola megadása</option>
                </select>
              </div>
            </div>

            {/* Bottles Count & Calculated Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                  Palackok száma (db)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={bottleCount}
                  onChange={(e) => setBottleCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#0B1535] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                  Összeg Ádinak
                </label>
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-emerald-800 flex items-center justify-between">
                  <span>{totalAmount.toLocaleString('hu-HU')} Ft</span>
                  <span className="text-[10px] text-emerald-600 font-bold">50 Ft/db</span>
                </div>
              </div>
            </div>

            {/* Submitter Name (Optional) */}
            <div>
              <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                Beküldő neve vagy osztálya (opcionális)
              </label>
              <input
                type="text"
                placeholder="Pl. Kovács Bence / 7.A osztály"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0B1535] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Bizonylat beküldése ellenőrzésre</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {step === 'submitting' && (
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
          <h4 id="submit-receipt-title" className="text-lg font-bold text-[#0B1535] mb-1">
            Bizonylat feldolgozása...
          </h4>
          <p id="submit-receipt-description" className="text-xs text-[#667085]">
            Azonosítók és REpont tranzakció hitelesítése folyamatban
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="py-6 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h3 id="submit-receipt-title" className="text-2xl font-extrabold text-[#0B1535] mb-2">
            Sikeres beküldés!
          </h3>

          <p
            id="submit-receipt-description"
            className="text-xs sm:text-sm text-[#667085] max-w-sm mb-6"
          >
            Köszönjük a segítségedet! A gyűjtésed bekerült a rendszerbe és hamarosan jóváírásra
            kerül az iskola profilján.
          </p>

          <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#667085]">Iskola:</span>
              <strong className="text-[#0B1535]">{selectedSchool}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">Palackok:</span>
              <strong className="text-[#0B1535]">{bottleCount} db</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">Adomány Ádinak:</span>
              <strong className="text-emerald-700 font-extrabold">
                {totalAmount.toLocaleString('hu-HU')} Ft
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">Állapot:</span>
              <span className="text-blue-600 font-semibold">Ellenőrzés alatt (~2-4 óra)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0B1535] hover:bg-slate-800 text-white font-bold text-sm py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            <span>Vissza a főoldalra</span>
          </button>
        </div>
      )}
    </ModalDialog>
  );
};
