'use client';
import { X } from 'lucide-react';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { ReturnMethods } from '@/components/sections/ReturnMethods';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubmitModal: () => void;
}

export function GuideModal({ isOpen, onClose, onOpenSubmitModal }: GuideModalProps) {
  if (!isOpen) return null;
  return (
    <ModalDialog
      labelId="guide-title"
      descriptionId="guide-description"
      onClose={onClose}
      className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl p-6 sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        data-autofocus
        aria-label="Bezárás"
        className="absolute top-5 right-5 rounded-full p-2 text-slate-500 hover:bg-slate-100"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 id="guide-title" className="pr-10 text-2xl font-extrabold">
        Visszaváltás és képfeltöltés
      </h2>
      <p id="guide-description" className="mt-3 mb-6 text-sm leading-relaxed text-slate-600">
        Gyűjtsetek legalább 50 palackot! A gyerekek tanári kísérettel, illetve a segítő szülők is
        visszaválthatják az iskolában összegyűjtött palackokat.
      </p>
      <ReturnMethods compact />
      <section className="mt-8">
        <h3 className="text-xl font-bold">A fotó feltöltése ezen az oldalon</h3>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-600">
          <li>
            Lépj be a saját tanári fiókodba. Feltölteni csak jóváhagyott iskolai tagsággal lehet.
          </li>
          <li>
            Válaszd ki az automata képernyőjéről készült éles fotót. A teljes visszaváltott
            darabszám legyen olvasható. JPEG, PNG vagy WebP kép tölthető fel, legfeljebb 10 MB
            méretben.
          </li>
          <li>
            Add meg a darabszámot és a visszaváltás dátumát. Az iskola a tagságod alapján
            automatikusan ki van választva.
          </li>
          <li>
            Ellenőrizd az összegzést, majd küldd be a gyűjtést. Állapotát a Beküldések menüben
            követheted.
          </li>
          <li>
            A jóváhagyott palackszám az iskola összesített eredményében és a ranglistán jelenik meg.
          </li>
        </ol>
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          Az iskolai feltöltéseket érdemes a kapcsolattartó tanárral egyeztetni, hogy ugyanaz a
          visszaváltás csak egyszer kerüljön beküldésre.
        </p>
      </section>
      <div className="mt-8 flex flex-col justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
        >
          Bezárás
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSubmitModal();
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          Képernyőfotó feltöltése
        </button>
      </div>
    </ModalDialog>
  );
}
