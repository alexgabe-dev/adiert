'use client';
import Link from 'next/link';
export default function TeacherError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-12 max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-extrabold">Most nem sikerült betölteni.</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Próbáld újra. Ha a hiba megmarad, írj az info@palackverseny.hu címre.
      </p>
      <button
        onClick={reset}
        className="mt-6 min-h-12 w-full rounded-xl bg-blue-600 px-5 text-sm font-bold text-white"
      >
        Újrapróbálom
      </button>
      <Link href="/tanar/belepes" className="mt-3 block p-3 text-sm font-bold text-blue-600">
        Vissza a belépéshez
      </Link>
    </div>
  );
}
