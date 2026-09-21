'use client';
import { Building2, ExternalLink, X } from 'lucide-react';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { REGISTRATION_STEPS } from '@/data/returnProcess';

interface SchoolRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SchoolRegisterModal({ isOpen, onClose }: SchoolRegisterModalProps) {
  if (!isOpen) return null;
  return (
    <ModalDialog
      labelId="school-register-title"
      descriptionId="school-register-description"
      onClose={onClose}
      className="max-h-[92vh] max-w-xl overflow-y-auto rounded-3xl p-6 sm:p-8"
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
      <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-blue-600 uppercase">
        <Building2 className="h-4 w-4" /> Iskolai csatlakozás
      </div>
      <h2 id="school-register-title" className="pr-8 text-2xl font-extrabold">
        Regisztráld az iskoládat!
      </h2>
      <p id="school-register-description" className="mt-3 text-sm leading-relaxed text-slate-600">
        Az általános iskolák a palackverseny.hu felületén regisztrálhatnak. Készítsd elő az iskola
        és a kapcsolattartó adatait.
      </p>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-700">
        {REGISTRATION_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm leading-relaxed text-blue-950">
        <h3 className="font-bold">Ki kezelje az iskola feltöltéseit?</h3>
        <p className="mt-2">
          A palackverseny.hu iskolai felületét a hozzáférési e-mail-címet és jelszót ismerő tanárok,
          illetve az iskola munkáját vállaló szülők használhatják. A feltöltéseket egyeztessétek a
          kapcsolattartóval.
        </p>
      </div>
      <a
        href="https://www.palackverseny.hu"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-700"
      >
        Regisztráció a palackverseny.hu oldalon{' '}
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
      <p className="mt-2 text-center text-xs text-slate-500">Külső oldal, új lapon nyílik meg.</p>
    </ModalDialog>
  );
}
