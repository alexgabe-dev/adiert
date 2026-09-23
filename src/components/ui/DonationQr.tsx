import Image from 'next/image';
import Link from 'next/link';
import { Download, Expand } from 'lucide-react';

export const DONATION_QR_PATH = '/qrcode/adiert-qr.png';

export function DonationQr({ large = false }: { large?: boolean }) {
  return (
    <div className="min-w-0">
      <div className={`mx-auto w-full bg-white ${large ? 'max-w-lg' : 'max-w-sm'}`}>
        <div className="p-[12%]">
          <Image
            src={DONATION_QR_PATH}
            alt="Ádi adománygyűjtő QR-kódja a REpont automatához"
            width={632}
            height={631}
            unoptimized
            className="block h-auto w-full"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {!large && (
          <Link
            href="/qr-kod"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Expand className="size-4 shrink-0" aria-hidden="true" />
            Megnyitás nagyban<span className="sr-only">, új lapon</span>
          </Link>
        )}
        <a
          href={DONATION_QR_PATH}
          download="adiert-qr.png"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0B1535] hover:bg-slate-50"
        >
          <Download className="size-4 shrink-0" aria-hidden="true" />
          QR-kód letöltése
        </a>
      </div>
    </div>
  );
}
