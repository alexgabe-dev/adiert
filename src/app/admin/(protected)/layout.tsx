import type { ReactNode } from 'react';
import Link from 'next/link';

import { requireActiveAdministrator } from '@/lib/auth/authorization';

import { signOutAction } from './actions';

interface ProtectedAdminLayoutProps {
  children: ReactNode;
}

const roleLabels = {
  reviewer: 'Ellenőr',
  admin: 'Adminisztrátor',
  super_admin: 'Főadminisztrátor',
};

export default async function ProtectedAdminLayout({ children }: ProtectedAdminLayoutProps) {
  const administrator = await requireActiveAdministrator();

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1535]">
      <header className="border-b border-[#E8ECF2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link href="/admin" className="text-xl font-extrabold tracking-tight">
              Ádiért Admin
            </Link>
            <p className="mt-1 text-xs font-semibold text-[#667085]">
              {administrator.displayName ?? administrator.email ?? 'Meghívott admin'} ·{' '}
              {roleLabels[administrator.role]}
            </p>
          </div>
          <nav aria-label="Adminisztrációs navigáció" className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100"
            >
              Áttekintés
            </Link>
            <Link
              href="/admin/bekuldesek"
              className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100"
            >
              Beküldések
            </Link>
            {administrator.role === 'reviewer' ? null : (
              <Link
                href="/admin/iskolak"
                className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100"
              >
                Iskolák
              </Link>
            )}
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-lg border border-[#D7DDEA] px-3 py-2 text-sm font-bold hover:bg-slate-50"
              >
                Kilépés
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
