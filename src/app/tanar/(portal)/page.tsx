import Link from 'next/link';
import { Camera, ArrowUpRight, Heart, Clock3, Trophy } from 'lucide-react';
import { requireTeacher } from '@/features/teacher/server';
export default async function Dashboard() {
  const { client, school } = await requireTeacher();
  const { data, error } = await client.rpc('school_portal_summary', { p_school: school.id });
  if (error) throw new Error('Az összesítés nem tölthető be.');
  const summary = data as {
    approved: number;
    pending: number;
    changes: number;
    rank: number | null;
    milestone: number;
  };
  const progress = Math.min(100, Math.round((summary.approved / summary.milestone) * 100));
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
          Sok kis segítség. Közös eredmény.
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ma is tehetünk Ádiért.
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {school.name} · {school.city}
        </p>
      </div>
      <Link
        href="/tanar/feltoltes"
        className="group flex items-center justify-between gap-4 rounded-3xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-600/15 transition active:scale-[.99] sm:p-8"
      >
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-white/15 p-3">
            <Camera className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xl font-extrabold">Új gyűjtés feltöltése</p>
            <p className="mt-1 text-sm text-blue-100">Egy fotó, pár adat. Máris közelebb.</p>
          </div>
        </div>
        <ArrowUpRight className="h-6 w-6 shrink-0" />
      </Link>
      {summary.changes > 0 && (
        <Link
          href="/tanar/bekuldesek?status=needs_review"
          className="block rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900"
        >
          {summary.changes} beküldéshez pontosítást kérünk. Megnézem →
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-5">
          <Heart className="h-5 w-5 text-emerald-600" />
          <p className="mt-3 text-3xl font-extrabold">{summary.approved.toLocaleString('hu-HU')}</p>
          <p className="mt-1 text-xs text-slate-500">jóváhagyott palack</p>
          <p className="mt-3 text-sm font-bold text-emerald-700">
            {(summary.approved * 50).toLocaleString('hu-HU')} Ft segítség
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5">
          <Clock3 className="h-5 w-5 text-amber-500" />
          <p className="mt-3 text-3xl font-extrabold">{summary.pending.toLocaleString('hu-HU')}</p>
          <p className="mt-1 text-xs text-slate-500">palack ellenőrzésre vár</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Jóváhagyás után kerül az eredményhez.
          </p>
        </div>
      </div>
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h2 className="font-bold">A következő közös mérföldkő</h2>
        </div>
        <p className="mt-4 text-2xl font-extrabold">
          {summary.milestone.toLocaleString('hu-HU')} palack
        </p>
        <div
          role="progressbar"
          aria-label="Mérföldkő teljesítése"
          aria-valuenow={summary.approved}
          aria-valuemin={0}
          aria-valuemax={summary.milestone}
          className="mt-4 h-3 overflow-hidden rounded-full bg-blue-50"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-700 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Még {(summary.milestone - summary.approved).toLocaleString('hu-HU')} palack. Együtt
          meglesz!
        </p>
        <p className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold">
          {summary.rank
            ? `${summary.rank}. hely az aktív kampány ranglistáján`
            : 'Az első jóváhagyott gyűjtéssel megjelenik a helyezésetek.'}
        </p>
      </section>
    </div>
  );
}
