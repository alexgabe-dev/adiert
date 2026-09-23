'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowRight, Check, Copy, QrCode } from 'lucide-react';
import { DonationQr } from '@/components/ui/DonationQr';

export function QrCodeCtaSection() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/#iskolaknak`);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <section id="iskolaknak" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex min-w-0 flex-col p-6 sm:p-10">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">Iskoláknak</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
            Csatlakozzatok a gyűjtéshez
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
            Az iskola kapcsolattartója saját tanári fiókot hoz létre, majd beküldi az iskola
            jelentkezését. Jóváhagyás után meghívhatja a kollégáit, és elkezdhetik feltölteni a
            visszaváltásokat.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tanar/regisztracio"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Iskola regisztrálása <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/tanar/belepes"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold hover:bg-slate-100"
            >
              Már van fiókom
            </Link>
          </div>
          <div className="mt-8 flex flex-1 items-end sm:mt-10">
            <Image
              src="/pics/palack1.png"
              alt="Diákok palackokat gyűjtenek az iskolájuk előtt"
              width={1536}
              height={1024}
              sizes="(min-width: 1280px) 580px, (min-width: 1024px) 50vw, (min-width: 640px) 512px, calc(100vw - 80px)"
              className="mx-auto block h-auto w-full max-w-lg object-contain mix-blend-multiply lg:max-w-none"
            />
          </div>
        </div>
        <div className="border-t border-slate-200 bg-white p-6 sm:p-10 lg:border-t-0 lg:border-l">
          <QrCode className="size-7 text-blue-600" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-bold">QR-kód a visszaváltáshoz</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Az adományozáshoz Ádi hivatalos REpont QR-kódja szükséges. Beolvasás után az automata
            kijelzőjén a „Szia Alapítvány” feliratot kell látnod.
          </p>
          <div className="mt-5">
            <DonationQr />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Indulás előtt mentsd el a kódot, így internet nélkül is meg tudod mutatni az
            automatánál.
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Hivatkozás másolva' : 'Oldal hivatkozásának másolása'}
          </button>
          {copyError && (
            <p role="alert" className="mt-2 text-sm text-rose-700">
              A másolás nem sikerült. A böngésző címsorából is kimásolhatod az oldal címét.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
