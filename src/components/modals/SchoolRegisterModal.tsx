'use client';

import React, { useState } from 'react';
import { X, Building2, CheckCircle2, ArrowRight, Package } from 'lucide-react';

import { ModalDialog } from '@/components/ui/ModalDialog';
import { launchConfetti } from '@/lib/confetti';

interface SchoolRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolRegisterModal: React.FC<SchoolRegisterModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    void launchConfetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <ModalDialog
      labelId="school-register-title"
      descriptionId="school-register-description"
      onClose={onClose}
      className="max-h-[92vh] max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        data-autofocus
        className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Bezárás"
      >
        <X className="w-5 h-5" />
      </button>

      {!submitted ? (
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            <Building2 className="w-4 h-4" />
            <span>Iskolai Csatlakozás</span>
          </div>

          <h3 id="school-register-title" className="text-2xl font-extrabold text-[#0B1535] mb-2">
            Csatlakoztasd az iskoládat!
          </h3>
          <p id="school-register-description" className="text-xs sm:text-sm text-[#667085] mb-6">
            Regisztráld az intézményedet, és ingyenesen postázzuk a nyomtatható kampányplakátokat és
            gyűjtődoboz-matricákat.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                Iskola hivatalos neve <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Pl. Széchenyi István Gimnázium"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0B1535] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                Település / Város <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Pl. Budapest, Veszprém, Eger"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0B1535] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                  Kapcsolattartó neve <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tanár / Igazgató neve"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0B1535] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1535] mb-1.5">
                  Kapcsolattartó e-mail <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="iskola@edu.hu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0B1535] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
              <Package className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Ingyenes indulócsomag:</strong> a regisztráció után 2 munkanapon belül
                elküldjük a digitális kampánycsomagot és a nyomtatható A4-es Ádiért QR plakátokat.
              </span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Iskola regisztrálása</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="py-6 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h3 id="school-register-title" className="text-2xl font-extrabold text-[#0B1535] mb-2">
            Köszönjük a regisztrációt!
          </h3>

          <p
            id="school-register-description"
            className="text-xs sm:text-sm text-[#667085] max-w-sm mb-6"
          >
            A(z) <strong>{schoolName || 'iskolátok'}</strong> adatai beérkeztek. Hamarosan
            felvesszük a kapcsolatot a megadott e-mail címen a kampányanyagokkal!
          </p>

          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
            className="w-full py-3 bg-[#0B1535] text-white font-bold text-sm rounded-xl"
          >
            Rendben
          </button>
        </div>
      )}
    </ModalDialog>
  );
};
