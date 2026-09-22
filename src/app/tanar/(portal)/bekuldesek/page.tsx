import Link from 'next/link';
import { requireTeacher, teacherSubmissions } from '@/features/teacher/server';
import { statusLabels } from '@/features/teacher/shared';
export default async function Submissions({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { membership } = await requireTeacher();
  const p = await searchParams;
  const page = Math.max(1, Math.min(100000, Math.floor(Number(p.page) || 1)));
  const { items, total } = await teacherSubmissions(membership.school_id, page, p.status);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Beküldések</h1>
      <p className="mt-3 text-sm text-slate-600">
        Az iskolátok beküldései és visszajelzései, egy helyen.
      </p>
      <form className="my-6 flex gap-2">
        <select
          name="status"
          defaultValue={p.status ?? ''}
          aria-label="Állapot szűrése"
          className="field"
        >
          <option value="">Minden állapot</option>
          {['pending', 'needs_review', 'approved', 'rejected'].map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <button className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold hover:bg-slate-50">
          Szűrés
        </button>
      </form>
      <div className="space-y-3">
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/tanar/bekuldesek/${s.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xl font-extrabold">
                {(s.status === 'approved'
                  ? s.approved_bottle_count
                  : s.submitted_bottle_count
                )?.toLocaleString('hu-HU') ?? '—'}{' '}
                palack
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${s.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : s.status === 'needs_review' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
              >
                {statusLabels[s.status]}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {s.returned_on ?? s.created_at.slice(0, 10)} · Részletek →
            </p>
            {s.feedback && <p className="mt-3 text-sm text-slate-600">{s.feedback}</p>}
          </Link>
        ))}
        {items.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center">
            <p className="text-lg font-bold">
              {p.status || page > 1 ? 'Nincs találat.' : 'Még nincs beküldött gyűjtés.'}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {p.status || page > 1
                ? 'Másik állapotot választva megjelenhetnek a keresett beküldések.'
                : 'Visszaváltás után töltsd fel az automata képernyőjéről készült fotót. Itt követheted az ellenőrzés állapotát.'}
            </p>
            <Link
              href={p.status || page > 1 ? '/tanar/bekuldesek' : '/tanar/feltoltes'}
              className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
            >
              {p.status || page > 1 ? 'Összes beküldés' : 'Első gyűjtés feltöltése'}
            </Link>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-between text-sm font-bold text-blue-600">
        {page > 1 ? (
          <Link href={`/tanar/bekuldesek?page=${page - 1}&status=${p.status ?? ''}`}>← Előző</Link>
        ) : (
          <span />
        )}
        {page * 20 < total && (
          <Link href={`/tanar/bekuldesek?page=${page + 1}&status=${p.status ?? ''}`}>
            Következő →
          </Link>
        )}
      </div>
    </div>
  );
}
