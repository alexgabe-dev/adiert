'use client';

import { useId, useState, type ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileCheck,
  History,
  Mail,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  School,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react';

import type { ActiveAdministrator } from '@/lib/auth/authorization';
import { administratorHasRole } from '@/lib/auth/roles';
import { signOutAction } from '@/app/admin/(protected)/actions';
import { ModalDialog } from '@/components/ui/ModalDialog';

interface AdminShellProps {
  administrator: ActiveAdministrator;
  children: ReactNode;
}

const roleLabels = {
  reviewer: 'Ellenőrző',
  admin: 'Főadmin',
  super_admin: 'Rendszergazda',
} as const;
const items: Array<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
  role: 'reviewer' | 'admin' | 'super_admin';
  exact?: boolean;
}> = [
  {
    href: '/admin',
    label: 'Áttekintés',
    icon: LayoutDashboard,
    role: 'reviewer' as const,
    exact: true,
  },
  { href: '/admin/bekuldesek', label: 'Beküldések', icon: FileCheck, role: 'reviewer' as const },
  { href: '/admin/jelentkezesek', label: 'Jelentkezések', icon: School, role: 'admin' },
  { href: '/admin/uzenetek', label: 'Üzenetküldés', icon: Mail, role: 'admin' },
  { href: '/admin/ertesitesek', label: 'Értesítések', icon: History, role: 'admin' },
  { href: '/admin/iskolak', label: 'Iskolák', icon: School, role: 'admin' as const },
  { href: '/admin/kampanyok', label: 'Kampányok', icon: Trophy, role: 'admin' as const },
  { href: '/admin/hirek', label: 'Hírek', icon: Newspaper, role: 'admin' as const },
  {
    href: '/admin/adminisztratorok',
    label: 'Adminisztrátorok',
    icon: ShieldCheck,
    role: 'super_admin' as const,
  },
  { href: '/admin/naplo', label: 'Napló', icon: History, role: 'super_admin' as const },
];

export function AdminShell({ administrator, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const drawerTitleId = useId();
  const pathname = usePathname();
  const navigation = (
    <nav aria-label="Adminisztrációs navigáció" className="space-y-1">
      {items
        .filter((item) => administratorHasRole(administrator.role, item.role))
        .map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1535]'}`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#F7F9FC] text-[#0B1535] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:p-4"
      >
        Ugrás a tartalomhoz
      </a>
      <aside className="hidden border-r border-[#E8ECF2] bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-[248px] lg:flex-col">
        <div className="border-b border-[#E8ECF2] px-5 py-5">
          <Link href="/admin" className="text-lg font-extrabold tracking-tight">
            Ádiért Admin
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">{navigation}</div>
        <div className="border-t border-[#E8ECF2] p-4">
          <p className="truncate text-sm font-bold">
            {administrator.displayName ?? administrator.email ?? 'Meghívott admin'}
          </p>
          <p className="mt-0.5 text-xs text-[#667085]">{roleLabels[administrator.role]}</p>
          <form action={signOutAction} className="mt-3">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Kilépés
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="safe-top sticky top-0 z-30 flex min-h-16 shrink-0 items-center gap-3 justify-between border-b border-[#E8ECF2] bg-white/95 safe-content backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 lg:hidden"
            aria-label="Navigáció megnyitása"
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin" className="font-extrabold lg:hidden">
            Ádiért Admin
          </Link>
          <div className="ml-auto text-right">
            <p className="text-xs font-bold text-[#667085]">{roleLabels[administrator.role]}</p>
          </div>
        </header>
        <main
          id="admin-content"
          className="safe-content mx-auto max-w-[1440px] py-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:py-8"
        >
          {children}
        </main>
      </div>

      {open ? (
        <ModalDialog
          labelId={drawerTitleId}
          onClose={() => setOpen(false)}
          className="mr-auto flex h-full max-w-[320px] flex-col rounded-2xl"
        >
          <div className="flex min-h-16 shrink-0 items-center gap-3 justify-between border-b border-[#E8ECF2] px-4">
            <strong id={drawerTitleId}>Ádiért Admin</strong>
            <button
              data-autofocus
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              aria-label="Bezárás"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">{navigation}</div>
          <div className="border-t border-[#E8ECF2] p-4">
            <p className="truncate text-sm font-bold">
              {administrator.displayName ?? administrator.email}
            </p>
            <p className="text-xs text-[#667085]">{roleLabels[administrator.role]}</p>
            <form action={signOutAction} className="mt-3">
              <button type="submit" className="flex min-h-11 items-center gap-2 text-sm font-bold">
                <LogOut className="h-4 w-4" />
                Kilépés
              </button>
            </form>
          </div>
        </ModalDialog>
      ) : null}
    </div>
  );
}
