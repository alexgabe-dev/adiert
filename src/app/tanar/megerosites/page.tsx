import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ActionForm } from '@/components/teacher/ActionForm';
import { activateTeacher } from './actions';
export const metadata = {
  title: 'Regisztráció megerősítése | Palackverseny',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Confirmation({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = /^[a-f0-9]{64}$/.test(token ?? '');
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 safe-content py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-lg font-extrabold text-blue-600">
          Ádiért.
        </Link>
        <ShieldCheck className="mt-8 size-10 text-blue-600" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Már csak egy lépés.</h1>
        <p className="mt-3 mb-6 text-sm leading-6 text-slate-600">
          Erősítsd meg az e-mail-címedet az alábbi gombbal. Ha a hozzáférésed rendben van, rögtön
          megnyílik a tanári felület.
        </p>
        {valid ? (
          <ActionForm action={activateTeacher} label="Megerősítem és belépek">
            <input type="hidden" name="token" value={token} />
          </ActionForm>
        ) : (
          <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            A megerősítő link hiányos. Nyisd meg újra a levélben található hivatkozást, vagy kérj
            újat.
          </p>
        )}
        <Link
          href="/tanar/belepes?mode=resend"
          className="mt-4 flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-3 text-center text-sm font-semibold text-slate-700"
        >
          Új megerősítő linket kérek
        </Link>
      </section>
    </main>
  );
}
