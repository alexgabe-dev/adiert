import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#E8ECF2] bg-white p-8 text-center shadow-sm">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-600">404</div>
        <h1 className="mb-2 text-3xl font-extrabold text-[#0B1535]">Az oldal nem található</h1>
        <p className="mb-6 text-sm text-[#667085]">
          Lehet, hogy a keresett oldal még nem érhető el, vagy megváltozott a címe.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
        >
          Vissza a főoldalra
        </Link>
      </div>
    </main>
  );
}
