import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getActiveAdministrator } from '@/lib/auth/authorization';
import { getSupabaseEnvironment } from '@/lib/supabase/config';
import { localTestLoginEnabled } from '@/lib/auth/local-test-login';

import { LoginForm } from './LoginForm';

export default async function AdminLoginPage() {
  const administrator = await getActiveAdministrator();
  if (administrator) {
    redirect('/admin');
  }

  const isConfigured = getSupabaseEnvironment() !== null;
  const localPassword = localTestLoginEnabled();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F7F9FC] safe-content py-12">
      <section className="w-full max-w-md rounded-3xl border border-[#E8ECF2] bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10">
        <Link
          href="/"
          className="inline-flex rounded-lg text-sm font-bold text-[#246BFD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246BFD]"
        >
          ← Vissza a nyilvános oldalra
        </Link>
        <div className="mt-8">
          <p className="text-sm font-extrabold tracking-widest text-[#246BFD] uppercase">Ádiért</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1535]">
            Adminisztráció
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#667085]">
            {localPassword
              ? 'Helyi tesztkörnyezet. Lépj be a tesztadmin e-mail-címével és jelszavával.'
              : 'Csak meghívott, aktív adminisztrátorok léphetnek be. A rendszer e-mailben küld egy egyszer használható belépési hivatkozást.'}
          </p>
        </div>

        {isConfigured ? (
          <LoginForm localPassword={localPassword} />
        ) : (
          <p
            role="status"
            className="mt-8 rounded-xl bg-amber-50 safe-content py-3 text-sm text-amber-900"
          >
            A Supabase-kapcsolat ebben a környezetben nincs beállítva.
          </p>
        )}
      </section>
    </main>
  );
}
