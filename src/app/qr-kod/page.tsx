import type { Metadata } from 'next';
import Link from 'next/link';
import { DonationQr } from '@/components/ui/DonationQr';

export const metadata: Metadata = {
  title: 'QR-kód a visszaváltáshoz',
  description: 'Ádi adománygyűjtő QR-kódja. Mutasd a REpont automata kódolvasójának.',
};

export default function QrCodePage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/#iskolaknak"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-600 hover:underline"
      >
        ← Vissza az oldalra
      </Link>
      <h1 className="mt-5 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
        Ezzel a kóddal Ádit támogatod.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-600">
        Mutasd a kódot az automata kódolvasójának. Ha nehezen olvassa be, növeld a telefonod
        fényerejét.
      </p>
      <div className="mt-4">
        <DonationQr large />
      </div>
      <p className="mx-auto mt-6 max-w-md text-center text-base leading-7 text-slate-700">
        Beolvasás után ellenőrizd a kijelzőt:
        <br />
        <strong className="text-[#0B1535]">„Szia Alapítvány”</strong>
      </p>
      <p className="mt-3 text-center text-sm leading-6 text-slate-500">
        Ha ez nem jelenik meg, ne zárd le a visszaváltást. Ellenőrizd, hogy a kód beolvasása
        sikerült-e.
      </p>
    </main>
  );
}
