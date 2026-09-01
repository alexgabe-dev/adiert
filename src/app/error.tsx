'use client';

import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#E8ECF2] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-[#0B1535]">Valami nem sikerült</h1>
        <p className="mb-6 text-sm text-[#667085]">
          Kérjük, próbáld újra. Ha a hiba továbbra is fennáll, írj nekünk az info@adiert.hu címen.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
        >
          Újrapróbálás
        </button>
      </div>
    </main>
  );
}
