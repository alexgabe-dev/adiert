'use client';

import React from 'react';
import { X } from 'lucide-react';
import { StepIcon } from '../illustrations/StepIcons';

import { ModalDialog } from '@/components/ui/ModalDialog';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubmitModal: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, onOpenSubmitModal }) => {
  if (!isOpen) return null;

  return (
    <ModalDialog
      labelId="guide-title"
      descriptionId="guide-description"
      onClose={onClose}
      className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-8"
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

      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
        <span>ÚTMUTATÓ</span>
      </div>

      <h3 id="guide-title" className="text-2xl sm:text-3xl font-extrabold text-[#0B1535] mb-2">
        Részletes útmutató és hasznos tippek
      </h3>
      <p id="guide-description" className="text-xs sm:text-sm text-[#667085] mb-8">
        Minden, amit a sikeres palackgyűjtésről és a bizonylat jóváhagyásáról tudni érdemes.
      </p>

      <div className="space-y-6 text-xs sm:text-sm">
        {/* Step 1 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-start">
          <div className="shrink-0 mt-0.5">
            <StepIcon type="bottles" size={40} />
          </div>
          <div>
            <h4 className="font-bold text-[#0B1535] mb-1">
              1. Milyen palackokat fogad el az automata?
            </h4>
            <p className="text-[#667085] leading-relaxed">
              Minden olyan 0,1 – 3 literes műanyag, üveg vagy fém italcsomagolást, amelyen szerepel
              az 50 Ft-os visszaváltási embléma. <strong>Fontos:</strong> a palackokat nem szabad
              összenyomni, és a vonalkódnak tisztának kell lennie!
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-start">
          <div className="shrink-0 mt-0.5">
            <StepIcon type="repont" size={40} />
          </div>
          <div>
            <h4 className="font-bold text-[#0B1535] mb-1">
              2. Hogyan használd az Ádiért QR-kódot a gépnél?
            </h4>
            <p className="text-[#667085] leading-relaxed">
              A REpont automatán a visszaváltás megkezdésekor érintsd a telefonodon megnyitott
              Ádiért QR-kódot az automata olvasójához. Ekkor a kijelzőn megjelenik az{' '}
              <em>„Adomány: Ádiért”</em> felirat.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-start">
          <div className="shrink-0 mt-0.5">
            <StepIcon type="camera" size={40} />
          </div>
          <div>
            <h4 className="font-bold text-[#0B1535] mb-1">3. Bizonylat kérése és lefotózása</h4>
            <p className="text-[#667085] leading-relaxed">
              A palackok bedobása után a gépen nyomd meg a <strong>Bizonylat nyomtatása</strong>{' '}
              gombot. Készíts egy jól megvilágított fotót a papírról úgy, hogy a bizonylatszám, a
              dátum és az összeg tisztán olvasható legyen.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-start">
          <div className="shrink-0 mt-0.5">
            <StepIcon type="trophy" size={40} />
          </div>
          <div>
            <h4 className="font-bold text-[#0B1535] mb-1">4. Jóváírás és ranglista verseny</h4>
            <p className="text-[#667085] leading-relaxed">
              A beküldést követően az adminisztrátorok ellenőrzik a bizonylatot. A jóváhagyott
              összeg automatikusan növeli az iskolád összpontszámát az országos ranglistán!
            </p>
          </div>
        </div>
      </div>

      {/* Modal footer CTAs */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-[#0B1535] font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
        >
          Értem, bezárás
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSubmitModal();
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-colors"
        >
          Gyűjtés beküldése
        </button>
      </div>
    </ModalDialog>
  );
};
