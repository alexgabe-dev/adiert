'use client';
import Link from 'next/link';
import { ModalDialog } from '@/components/ui/ModalDialog';
export function SchoolRegisterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <ModalDialog labelId="register-title" onClose={onClose} className="max-w-md rounded-3xl p-6">
      <h2 id="register-title" className="text-2xl font-bold">
        Csatlakoztasd az iskoládat!
      </h2>
      <p className="my-4 text-sm text-slate-600">
        A regisztrációnál irányítószám alapján válaszd ki az iskolát, majd add meg a kapcsolattartó
        adatait. A szervezők döntéséről e-mailt kapsz.
      </p>
      <Link
        href="/tanar/regisztracio"
        className="block rounded-xl bg-blue-600 p-4 text-center font-bold text-white"
      >
        Regisztráció indítása
      </Link>
      <button onClick={onClose} className="mt-3 w-full p-3 text-sm">
        Bezárás
      </button>
    </ModalDialog>
  );
}
