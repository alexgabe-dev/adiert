'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, ArrowRight, Upload, RotateCcw } from 'lucide-react';
import { launchConfetti } from '@/lib/confetti';
import { uploadDetailsSchema } from '@/features/teacher/shared';
import type { TeacherSubmission } from '@/features/teacher/server';
const messages: Record<string, string> = {
  unauthenticated: 'A munkamenet lejárt. Lépj be újra egy másik lapon, majd próbáld újra.',
  not_member: 'Az iskolai hozzáférésed nem aktív.',
  invalid_details:
    'Ellenőrizd a darabszámot, a dátumot és a megjegyzést. 50 darab alatt indoklás szükséges.',
  oversized_file: 'A kép legfeljebb 10 MB lehet.',
  unsupported_type: 'JPEG, PNG vagy WebP fotót válassz.',
  invalid_image: 'Ez a kép nem olvasható. Válassz másikat.',
  invalid_dimensions: 'A fotó felbontása nem megfelelő.',
  rate_limited: 'Sok beküldés érkezett. Várj egy kicsit, majd próbáld újra.',
  no_campaign: 'Jelenleg nincs aktív gyűjtési kampány.',
  conflict:
    'Ezt a beküldést közben módosították, vagy a korábbi kérés adatai eltérnek. Ellenőrizd a Beküldések között, mielőtt újra küldöd.',
};
export function UploadFlow({ school, revision }: { school: string; revision?: TeacherSubmission }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [count, setCount] = useState(revision?.submitted_bottle_count?.toString() ?? '');
  const [date, setDate] = useState(
    revision?.returned_on ??
      new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' }),
  );
  const [note, setNote] = useState(revision?.teacher_note ?? '');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  const heading = useRef<HTMLHeadingElement>(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  useEffect(() => {
    if (step > 1) heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (!file || step === 4) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [file, step]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function changeFile(f: File | undefined) {
    if (!f) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 10 * 1024 * 1024) {
      setFile(null);
      setPreview('');
      setError('JPEG, PNG vagy WebP fotót válassz, legfeljebb 10 MB méretben.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setKey(crypto.randomUUID());
  }
  async function useOriginal() {
    if (!revision) return;
    setLoadingOriginal(true);
    setError('');
    try {
      const response = await fetch(`/api/teacher/submissions/${revision.id}/image`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      changeFile(new File([blob], 'korabbi-foto.webp', { type: blob.type }));
    } catch {
      setError('A korábbi fotó nem tölthető be. Próbáld újra, vagy válassz képet az eszközödről.');
    } finally {
      setLoadingOriginal(false);
    }
  }
  function next() {
    setError('');
    if (step === 1 && !file) {
      setError('Először válassz egy képernyőfotót.');
      return;
    }
    if (step === 2 && !uploadDetailsSchema.safeParse({ count, date, note }).success) {
      setError(
        !Number.isInteger(Number(count)) || Number(count) < 1 || Number(count) > 100000
          ? 'Adj meg egy egész palackszámot 1 és 100 000 között.'
          : Number(count) < 50 && note.trim().length < 5
            ? '50 palack alatti visszaváltásnál írj rövid indoklást a megjegyzéshez (legalább 5 karakter).'
            : 'Ellenőrizd a dátumot. 2024. január 1. és a mai nap közötti dátum adható meg.',
      );
      return;
    }
    setStep(step + 1);
  }
  async function submit() {
    if (!file || pending) return;
    setPending(true);
    setError('');
    const form = new FormData();
    form.set('receipt', file);
    form.set('count', count);
    form.set('date', date);
    form.set('note', note);
    if (revision) {
      form.set('revision', revision.id);
      form.set('version', String(revision.version));
    }
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Idempotency-Key': key },
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (typeof body.publicReference !== 'string' || body.status !== 'pending')
        throw new Error('unavailable');
      setReference(body.publicReference);
      setStep(4);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        void launchConfetti({ particleCount: 65, spread: 65, origin: { y: 0.7 } });
    } catch (e) {
      setError(
        messages[e instanceof Error ? e.message : ''] ??
          'A feltöltés nem sikerült. Az adataid megmaradtak; próbáld újra.',
      );
    } finally {
      setPending(false);
    }
  }
  if (step === 4)
    return (
      <div className="rounded-3xl bg-white p-8 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check className="h-10 w-10" />
        </span>
        <h1 ref={heading} tabIndex={-1} className="mt-6 text-3xl font-extrabold">
          A beküldés megérkezett.
        </h1>
        <p className="mt-4 text-lg">
          <strong>{Number(count).toLocaleString('hu-HU')} palackos</strong> beküldésed megérkezett.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Most az ellenőrzőkön a sor. Jóváhagyás után az eredmény az iskolátok számlálóján is
          megjelenik.
        </p>
        <p className="mt-4 break-all text-xs text-slate-400">Hivatkozás: {reference}</p>
        <Link
          href="/tanar/bekuldesek"
          className="mt-7 block rounded-xl bg-blue-600 px-5 py-4 font-bold text-white"
        >
          Megnézem a beküldéseket
        </Link>
        <Link href="/tanar" className="mt-3 block py-3 text-sm font-semibold text-blue-600">
          Vissza a kezdőlapra
        </Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-xl">
      <h1 ref={heading} tabIndex={-1} className="text-3xl font-extrabold tracking-tight">
        {revision ? 'Beküldés javítása' : 'Új gyűjtés feltöltése'}
      </h1>
      <p className="mt-3 text-sm text-slate-600">{school}</p>
      {revision?.feedback && (
        <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Kért javítás:</strong> {revision.feedback}
        </p>
      )}
      <ol aria-label="Feltöltési lépések" className="my-7 flex gap-2">
        {['Fotó', 'Adatok', 'Beküldés'].map((label, i) => (
          <li
            key={label}
            aria-current={step === i + 1 ? 'step' : undefined}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold ${step >= i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}
          >
            <span>{step > i + 1 ? '✓' : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold">Fotó az automata kijelzőjéről</h2>
            <p className="mt-3 mb-5 text-sm leading-relaxed text-slate-600">
              Az automata kijelzőjét a fizetés előtt fotózd le. A teljes visszaváltott darabszám
              legyen látható.
            </p>
            {revision && (
              <button
                type="button"
                disabled={loadingOriginal}
                onClick={useOriginal}
                className="mb-5 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingOriginal ? 'Fotó betöltése…' : 'A korábbi fotót használom'}
              </button>
            )}
            {preview && (
              <div className="mb-4 overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Kiválasztott képernyőfotó"
                  className="max-h-80 w-full object-contain"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-700 focus-within:ring-2 focus-within:ring-blue-500 hover:bg-blue-100">
                <Camera className="h-6 w-6" />
                Fotó készítése
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => changeFile(e.target.files?.[0])}
                />
              </label>
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 p-3 text-center text-sm font-bold focus-within:ring-2 focus-within:ring-blue-500 hover:bg-slate-50">
                <Upload className="h-6 w-6" />
                Kép kiválasztása
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => changeFile(e.target.files?.[0])}
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-500">JPEG, PNG vagy WebP · legfeljebb 10 MB</p>
          </>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <label className="block text-sm font-bold">
              Hány palackot váltottatok vissza?
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={100000}
                value={count}
                onChange={(e) => {
                  setCount(e.target.value);
                  setKey(crypto.randomUUID());
                }}
                className="bottle-count-input mt-3 w-full rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center text-4xl font-extrabold outline-blue-500"
              />
            </label>
            <p className="text-center text-sm text-blue-700">
              {Number(count) > 0 && Number(count) <= 100000
                ? `${(Number(count) * 50).toLocaleString('hu-HU')} Ft visszaváltási díj`
                : 'Minden visszaváltott palack 50 Ft.'}
            </p>
            <label className="block text-sm font-bold">
              Visszaváltás dátuma
              <input
                type="date"
                min="2024-01-01"
                value={date}
                max={new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' })}
                onChange={(e) => {
                  setDate(e.target.value);
                  setKey(crypto.randomUUID());
                }}
                className="field mt-2"
              />
            </label>
            <label className="block text-sm font-bold">
              Megjegyzés{' '}
              {count && Number(count) < 50 ? '(50 palack alatt kötelező)' : '(nem kötelező)'}
              <textarea
                value={note}
                maxLength={500}
                onChange={(e) => {
                  setNote(e.target.value);
                  setKey(crypto.randomUUID());
                }}
                rows={3}
                className="field mt-2"
              />
            </label>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold">Ellenőrizd a fotót és az adatokat</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Beküldésre váró képernyőfotó"
              className="mt-5 max-h-64 w-full rounded-2xl bg-slate-50 object-contain"
            />
            <div className="my-5 rounded-2xl bg-blue-50 p-5">
              <p className="text-3xl font-extrabold">
                {Number(count).toLocaleString('hu-HU')} palack
              </p>
              <p className="mt-2 text-sm">
                {new Date(`${date}T12:00:00`).toLocaleDateString('hu-HU')} · {school}
              </p>
              {note && <p className="mt-3 text-sm text-slate-600">{note}</p>}
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              A képet és a darabszámot ellenőrizzük. A jóváhagyott gyűjtés az iskolátok eredményét
              növeli.
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {step > 1 && (
            <button
              disabled={pending}
              onClick={() => setStep(step - 1)}
              className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold"
            >
              Vissza
            </button>
          )}
          <button
            disabled={pending}
            onClick={step === 3 ? submit : next}
            className="flex min-h-12 min-w-40 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-4 font-bold text-white transition active:scale-[.98] disabled:opacity-60"
          >
            {pending ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Feltöltés folyamatban…
              </>
            ) : step === 3 ? (
              'Beküldöm ellenőrzésre'
            ) : (
              <>
                Tovább
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
        <p aria-live="polite" className="mt-3 text-xs text-slate-500">
          {pending
            ? 'A fotó méretétől és a kapcsolattól függően ez eltarthat néhány másodpercig.'
            : ''}
        </p>
      </div>
    </div>
  );
}
