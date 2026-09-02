import { requireActiveAdministrator } from '@/lib/auth/authorization';

export default async function AdminPage() {
  const administrator = await requireActiveAdministrator();

  return (
    <section>
      <p className="text-sm font-extrabold tracking-widest text-[#246BFD] uppercase">
        Biztonságos alap
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Adminisztrációs áttekintés</h1>
      <div className="mt-8 rounded-2xl border border-[#E8ECF2] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">Phase 2 hozzáférés aktív</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
          A munkamenet szerveroldalon ellenőrzött, az aktív szerepkör az adatbázisból származik. A
          beküldési és felülvizsgálati munkafolyamat a következő fázis része, ezért ezen a felületen
          még nem végezhető adatmutáció.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#F7F9FC] p-4">
            <dt className="text-xs font-bold tracking-wide text-[#667085] uppercase">Szerepkör</dt>
            <dd className="mt-1 font-extrabold">{administrator.role}</dd>
          </div>
          <div className="rounded-xl bg-[#F7F9FC] p-4">
            <dt className="text-xs font-bold tracking-wide text-[#667085] uppercase">Állapot</dt>
            <dd className="mt-1 font-extrabold text-emerald-700">Aktív</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
