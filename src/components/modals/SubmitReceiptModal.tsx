'use client';
import Link from 'next/link';
import { ModalDialog } from '@/components/ui/ModalDialog';
import type { SchoolSelection } from '@/features/public-data/types';
export function SubmitReceiptModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultSchool?: SchoolSelection | null;
}) {
  if (!isOpen) return null;
  return (
    <ModalDialog labelId="submit-title" onClose={onClose} className="max-w-md rounded-3xl p-6">
      <h2 id="submit-title" className="text-2xl font-bold">
        Gyűjtés beküldése
      </h2>
      <p className="my-4 text-sm text-slate-600">
        A feltöltéshez lépj be a saját tanári fiókodba. Az iskoládat a tagságod alapján választjuk
        ki.
      </p>
      <Link
        href="/tanar/feltoltes"
        className="block rounded-xl bg-blue-600 p-4 text-center font-bold text-white"
      >
        Tovább a tanári felületre
      </Link>
      <button onClick={onClose} className="mt-3 w-full p-3 text-sm">
        Bezárás
      </button>
    </ModalDialog>
  );
}
