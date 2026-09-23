import Link from 'next/link';
import { RegistrationForm } from './RegistrationForm';
import { ArrowLeft, ArrowRight, Heart, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { ActionForm, Field } from './ActionForm';
import { teacherAuthAction } from '@/features/teacher/actions';
export function AuthScreen({
  mode = 'login',
  notice,
}: {
  mode?: 'login' | 'signup' | 'reset' | 'update_password' | 'resend';
  notice?: string;
}) {
  const titles = {
    login: 'Tanári belépés',
    signup: 'Tanári fiók létrehozása',
    reset: 'Elfelejtett jelszó',
    update_password: 'Állíts be új jelszót.',
    resend: 'Erősítsd meg az e-mail-címed.',
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,#e4edff_0%,#f5f8fd_55%)] px-4 py-8 sm:py-12">
      <div className="w-full max-w-[460px]">
        <Link
          href="/"
          className="mb-7 flex w-fit items-center gap-2.5 rounded-xl text-xl font-extrabold"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/15">
            <Heart className="size-5 fill-current" aria-hidden="true" />
          </span>{' '}
          Ádiért.
        </Link>
        <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5">
          <div className="p-6 sm:p-8">
            <p className="mb-3 text-xs font-bold tracking-widest text-blue-600 uppercase">
              Iskolai csapatoknak
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">{titles[mode]}</h1>
            <p className="mt-3 mb-6 text-sm leading-relaxed text-slate-600">
              {
                {
                  login: 'Lépj be, és folytasd az iskolád gyűjtését.',
                  signup:
                    'Válaszd ki az iskoládat, és add meg a kapcsolattartó adatait. A jelentkezést a szervezők ellenőrzik.',
                  reset: 'Elküldjük e-mailben a jelszó-visszaállításhoz szükséges hivatkozást.',
                  resend:
                    'Add meg a regisztrációnál használt címed, és új megerősítő levelet küldünk.',
                  update_password: 'Válassz egy legalább 10 karakteres, biztonságos jelszót.',
                }[mode]
              }
            </p>
            {notice && (
              <p
                role="status"
                className="mb-6 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950"
              >
                {notice}
              </p>
            )}
            {mode === 'signup' ? (
              <RegistrationForm />
            ) : (
              <ActionForm
                action={teacherAuthAction}
                label={
                  mode === 'login'
                    ? 'Belépek'
                    : mode === 'update_password'
                      ? 'Jelszó mentése'
                      : 'E-mail küldése'
                }
              >
                <input type="hidden" name="mode" value={mode} />
                {mode !== 'update_password' && (
                  <Field label="E-mail-cím" name="email" type="email" autoComplete="email" />
                )}
                {['login', 'update_password'].includes(mode) && (
                  <Field
                    label={mode === 'login' ? 'Jelszó' : 'Jelszó (legalább 10 karakter)'}
                    name="password"
                    type="password"
                    minLength={10}
                    maxLength={128}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                )}
              </ActionForm>
            )}
            {mode === 'login' ? (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="mb-3 text-center text-sm text-slate-500">Most csatlakozol először?</p>
                <Link
                  href="/tanar/regisztracio"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  Tanári fiók létrehozása <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <Link
                href="/tanar/belepes"
                className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft className="size-4" aria-hidden="true" /> Vissza a belépéshez
              </Link>
            )}
          </div>
          {mode === 'login' && (
            <div className="border-t border-slate-100 bg-slate-50/80 p-5 sm:px-8">
              <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
                Segítség a belépéshez
              </p>
              <div className="grid gap-1">
                <Link
                  href="/tanar/belepes?mode=reset"
                  className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-blue-700"
                >
                  <KeyRound className="size-4 shrink-0 text-slate-400" aria-hidden="true" />{' '}
                  Elfelejtettem a jelszavam{' '}
                  <ArrowRight
                    className="ml-auto size-4 shrink-0 text-slate-400 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/tanar/belepes?mode=resend"
                  className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-blue-700"
                >
                  <Mail className="size-4 shrink-0 text-slate-400" aria-hidden="true" /> Nem kaptam
                  megerősítő e-mailt{' '}
                  <ArrowRight
                    className="ml-auto size-4 shrink-0 text-slate-400 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          )}
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" /> Saját fiók. Közös cél.
          Együtt Ádiért.
        </p>
      </div>
    </main>
  );
}
