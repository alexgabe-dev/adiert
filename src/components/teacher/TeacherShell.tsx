'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, Layers, Users, Heart, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { teacherSignOut } from '@/features/teacher/actions';
const links = [
  { href: '/tanar', label: 'Kezdőlap', icon: Home },
  { href: '/tanar/feltoltes', label: 'Feltöltés', icon: Camera },
  { href: '/tanar/bekuldesek', label: 'Beküldések', icon: Layers },
  { href: '/tanar/iskolam', label: 'Iskolám', icon: Users },
] as const;
export function TeacherShell({
  children,
  school,
  name,
}: {
  children: ReactNode;
  school: string;
  name: string;
}) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-[#F5F8FD] text-[#0B1535]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/tanar" className="flex shrink-0 items-center gap-2 text-lg font-extrabold">
            <Heart className="h-5 w-5 fill-blue-600 text-blue-600" />
            Ádiért.
          </Link>
          <p className="min-w-0 truncate text-xs font-semibold text-slate-600">{school}</p>
          <form action={teacherSignOut}>
            <button
              aria-label="Kilépés"
              className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-7 pb-32 sm:px-6">
        <p className="mb-5 text-xs text-slate-500">{name} · Iskolai csapat</p>
        {children}
      </main>
      <nav
        aria-label="Iskolai navigáció"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 p-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/tanar' ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
