'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Camera, Layers, Users, Heart, LogOut, CircleHelp } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { GuideModal } from '@/components/modals/GuideModal';
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
  const router = useRouter();
  const [help, setHelp] = useState(false);
  return (
    <div className="min-h-dvh bg-[#F5F8FD] text-[#0B1535]">
      <a
        href="#teacher-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-white focus:p-4"
      >
        Ugrás a tartalomhoz
      </a>
      <header className="safe-top sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="safe-content mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_44px_44px] items-center gap-x-2 gap-y-2 py-2 sm:flex sm:gap-3 sm:py-3">
          <Link href="/tanar" className="flex shrink-0 items-center gap-2 text-lg font-extrabold">
            <Heart className="h-5 w-5 fill-blue-600 text-blue-600" />
            Ádiért.
          </Link>
          <div className="order-last col-span-3 min-w-0 border-t border-slate-100 pt-2 pb-1 sm:order-none sm:flex-1 sm:border-0 sm:px-2 sm:py-0 sm:text-right">
            <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-700 sm:truncate">
              {school}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">{name}</p>
          </div>
          <button
            type="button"
            onClick={() => setHelp(true)}
            aria-label="Visszaváltási és feltöltési útmutató"
            title="Útmutató"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <CircleHelp className="size-5" aria-hidden="true" />
          </button>
          <form action={teacherSignOut}>
            <button
              aria-label="Kilépés"
              title="Kilépés"
              className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
        <nav
          aria-label="Iskolai navigáció"
          className="mx-auto hidden max-w-5xl gap-1 px-6 pb-3 md:flex"
        >
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/tanar' ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="ml-auto flex items-center px-3 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            Nyilvános oldal ↗
          </Link>
        </nav>
      </header>
      <main
        id="teacher-content"
        className="safe-content mx-auto max-w-5xl pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:py-10"
      >
        {children}
      </main>
      <nav
        aria-label="Iskolai navigáció"
        className="teacher-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 pl-[max(8px,env(safe-area-inset-left))] pr-[max(8px,env(safe-area-inset-right))] py-2">
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
      <GuideModal
        isOpen={help}
        onClose={() => setHelp(false)}
        onOpenSubmitModal={() => router.push('/tanar/feltoltes')}
      />
    </div>
  );
}
