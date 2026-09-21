import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireTeacher, type TeacherSubmission } from '@/features/teacher/server';
import { statusLabels } from '@/features/teacher/shared';
import { UploadFlow } from '@/components/teacher/UploadFlow';
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { client, membership, school } = await requireTeacher();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await client
    .from('submissions')
    .select('*')
    .eq('id', id)
    .eq('school_id', membership.school_id)
    .maybeSingle();
  if (error) throw new Error('A beküldés nem tölthető be.');
  if (!data) notFound();
  const s = data as TeacherSubmission;
  return (
    <div className="space-y-6">
      <Link href="/tanar/bekuldesek" className="text-sm font-bold text-blue-600">
        ← Beküldések
      </Link>
      <div className="rounded-3xl bg-white p-6">
        <p className="text-sm font-bold text-blue-600">{statusLabels[s.status]}</p>
        <h1 className="mt-3 text-3xl font-extrabold">
          {s.status === 'approved' ? s.approved_bottle_count : s.submitted_bottle_count} palack
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {s.returned_on} · {school.name}
        </p>
        {s.feedback && (
          <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm leading-relaxed">{s.feedback}</p>
        )}
        <a
          href={`/api/teacher/submissions/${id}/image`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block"
          aria-label="A feltöltött fotó megnyitása nagy méretben"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/teacher/submissions/${id}/image`}
            alt="Beküldött képernyőfotó"
            className="max-h-96 w-full rounded-2xl bg-slate-50 object-contain"
          />
        </a>
        <p className="mt-3 text-xs text-slate-500">
          A fotóra koppintva nagyobb méretben is megnézheted.
        </p>
        {s.teacher_note && <p className="mt-4 text-sm">Megjegyzés: {s.teacher_note}</p>}
        <p className="mt-4 break-all text-xs text-slate-400">Hivatkozás: {s.public_reference}</p>
      </div>
      {s.status === 'needs_review' && <UploadFlow school={school.name} revision={s} />}
    </div>
  );
}
