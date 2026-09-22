'use client';
import Link from 'next/link';

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8">
      <h1 className="text-2xl font-bold">Az oldal most nem tölthető be.</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Próbáld újra. Ha mentés közben történt a hiba, ellenőrizd a listában, hogy a változtatás
        megjelent-e, mielőtt újra elküldöd.
      </p>
      <button
        onClick={reset}
        className="mt-6 min-h-12 w-full rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
      >
        Újrapróbálom
      </button>
      <Link
        href="/admin"
        className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold"
      >
        Vissza az áttekintéshez
      </Link>
    </section>
  );
}
