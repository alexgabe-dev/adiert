'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileCheck, History, LayoutDashboard, LogOut, Menu, Newspaper, School,
  ShieldCheck, Trophy, X,
} from 'lucide-react';

import type { ActiveAdministrator } from '@/lib/auth/authorization';
import { administratorHasRole } from '@/lib/auth/roles';
import { signOutAction } from '@/app/admin/(protected)/actions';

interface AdminShellProps { administrator: ActiveAdministrator; children: ReactNode }

const roleLabels = { reviewer: 'Reviewer', admin: 'Admin', super_admin: 'Super Admin' } as const;
const items = [
  { href: '/admin', label: 'Áttekintés', icon: LayoutDashboard, role: 'reviewer' as const, exact: true },
  { href: '/admin/bekuldesek', label: 'Beküldések', icon: FileCheck, role: 'reviewer' as const },
  { href: '/admin/iskolak', label: 'Iskolák', icon: School, role: 'admin' as const },
  { href: '/admin/kampanyok', label: 'Kampányok', icon: Trophy, role: 'admin' as const },
  { href: '/admin/hirek', label: 'Hírek', icon: Newspaper, role: 'admin' as const },
  { href: '/admin/adminisztratorok', label: 'Adminisztrátorok', icon: ShieldCheck, role: 'super_admin' as const },
  { href: '/admin/naplo', label: 'Napló', icon: History, role: 'super_admin' as const },
];

export function AdminShell({ administrator, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navigation = (
    <nav aria-label="Adminisztrációs navigáció" className="space-y-1">
      {items.filter((item) => administratorHasRole(administrator.role, item.role)).map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1535]'}`}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />{item.label}
        </Link>;
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1535] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-[#E8ECF2] bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-[248px] lg:flex-col">
        <div className="border-b border-[#E8ECF2] px-5 py-5"><Link href="/admin" className="text-lg font-extrabold tracking-tight">Ádiért Admin</Link></div>
        <div className="flex-1 overflow-y-auto p-3">{navigation}</div>
        <div className="border-t border-[#E8ECF2] p-4">
          <p className="truncate text-sm font-bold">{administrator.displayName ?? administrator.email ?? 'Meghívott admin'}</p>
          <p className="mt-0.5 text-xs text-[#667085]">{roleLabels[administrator.role]}</p>
          <form action={signOutAction} className="mt-3"><button type="submit" className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><LogOut className="h-4 w-4" aria-hidden="true" />Kilépés</button></form>
        </div>
      </aside>

      <div className="lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E8ECF2] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button type="button" onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 lg:hidden" aria-label="Navigáció megnyitása"><Menu className="h-5 w-5" /></button>
          <Link href="/admin" className="font-extrabold lg:hidden">Ádiért Admin</Link>
          <div className="ml-auto text-right"><p className="text-xs font-bold text-[#667085]">{roleLabels[administrator.role]}</p></div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>

      {open ? <div className="fixed inset-0 z-50 lg:hidden">
        <button type="button" className="absolute inset-0 bg-slate-950/35" onClick={() => setOpen(false)} aria-label="Navigáció bezárása" />
        <aside role="dialog" aria-modal="true" aria-label="Adminisztrációs navigáció" className="relative flex h-full w-[min(86vw,320px)] flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between border-b border-[#E8ECF2] px-4"><strong>Ádiért Admin</strong><button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Bezárás"><X className="h-5 w-5" /></button></div>
          <div className="flex-1 overflow-y-auto p-3">{navigation}</div>
          <div className="border-t border-[#E8ECF2] p-4"><p className="truncate text-sm font-bold">{administrator.displayName ?? administrator.email}</p><p className="text-xs text-[#667085]">{roleLabels[administrator.role]}</p><form action={signOutAction} className="mt-3"><button type="submit" className="flex min-h-11 items-center gap-2 text-sm font-bold"><LogOut className="h-4 w-4" />Kilépés</button></form></div>
        </aside>
      </div> : null}
    </div>
  );
}
