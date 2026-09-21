import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { ReviewForm } from '@/components/admin/ReviewForm';
import { getAdminSubmission, type SubmissionStatus } from '@/features/admin/submissions';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const statusLabels: Record<SubmissionStatus, string> = {
  pending: 'Függőben',
  needs_review: 'Javítást kérünk',
  approved: 'Jóváhagyott',
  rejected: 'Elutasított',
};

interface AdminSubmissionPageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function formatAmount(value: number | null) {
  return value === null ? '—' : `${value.toLocaleString('hu-HU')} Ft`;
}

export default async function AdminSubmissionPage({ params }: AdminSubmissionPageProps) {
  const administrator = await requireAdministratorRole('reviewer');
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error('Admin database connection is unavailable');
  const submission = await getAdminSubmission(supabase, id);
  if (!submission) notFound();

  const { data: sender } = submission.submittedBy
    ? await supabase
        .from('school_memberships')
        .select('display_name,email')
        .eq('user_id', submission.submittedBy)
        .maybeSingle()
    : { data: null };
  const { data: revisions, error: revisionError } = await supabase
    .from('submission_revisions')
    .select('id,version,bottle_count,created_at')
    .eq('submission_id', id)
    .order('created_at', { ascending: false });
  if (revisionError) throw new Error('A korábbi változatok nem tölthetők be.');
  return (
    <section>
      <Link href="/admin/bekuldesek" className="text-sm font-bold text-blue-600 hover:underline">
        ← Vissza a beküldésekhez
      </Link>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-extrabold tracking-widest text-[#246BFD] uppercase">
            {statusLabels[submission.status]}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{submission.schoolName}</h1>
          <p className="mt-2 font-mono text-xs text-[#667085]">{submission.publicReference}</p>
        </div>
        <div className="text-sm text-[#667085] sm:text-right">
          <p>{submission.campaignName}</p>
          <time dateTime={submission.createdAt}>{formatDateTime(submission.createdAt)}</time>
          <p className="mt-1">Verzió: {submission.version}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E8ECF2] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-extrabold">Beküldött képernyőfotó</h2>
          <p className="mt-1 text-xs text-[#667085]">
            A fotóra kattintva új lapon nagyíthatod a képet.
          </p>
          <div className="mt-4 flex min-h-80 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {/* Private receipts intentionally bypass the public Next image optimizer. */}

            <a
              href={`/api/admin/submissions/${submission.id}/receipt`}
              target="_blank"
              rel="noreferrer"
              aria-label="Képernyőfotó nagyítása"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/submissions/${submission.id}/receipt`}
                alt="Privát bizonylatkép kézi ellenőrzéshez"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-full object-contain"
              />
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold">Beküldési adatok</h2>
            <div className="my-4 rounded-xl bg-blue-50 p-4">
              <p className="text-2xl font-extrabold">
                {submission.submittedBottleCount ?? '—'} beküldött palack
              </p>
              <p className="mt-2 text-sm">
                {submission.returnedOn} · {sender?.display_name ?? 'Korábbi beküldés'}
              </p>
              {submission.teacherNote && <p className="mt-2 text-sm">{submission.teacherNote}</p>}
              {submission.feedback && (
                <p className="mt-2 text-sm font-semibold">Visszajelzés: {submission.feedback}</p>
              )}
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#667085]">Iskola</dt>
                <dd className="font-bold">
                  {submission.schoolName}{' '}
                  {submission.schoolCity ? `(${submission.schoolCity})` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-[#667085]">Állapot</dt>
                <dd className="font-bold">{statusLabels[submission.status]}</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Jóváhagyott összeg</dt>
                <dd className="font-bold">{formatAmount(submission.approvedAmount)}</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Jóváhagyott palack</dt>
                <dd className="font-bold">{submission.approvedBottleCount ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Bizonylatazonosító</dt>
                <dd className="break-all font-bold">{submission.receiptIdentifier ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Bizonylat dátuma</dt>
                <dd className="font-bold">{submission.receiptDate ?? '—'}</dd>
              </div>
            </dl>
            {submission.rejectionReason ? (
              <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                Elutasítás oka: {submission.rejectionReason}
              </p>
            ) : null}
          </div>

          {(submission.detectedAmount !== null ||
            submission.detectedBottleCount !== null ||
            submission.detectedReceiptIdentifier !== null ||
            submission.detectedReceiptDate !== null) && (
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold">Korábban rögzített észlelt mezők</h2>
              <p className="mt-1 text-xs text-[#667085]">Ezek nem jóváhagyott értékek.</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#667085]">Összeg</dt>
                  <dd className="font-bold">{formatAmount(submission.detectedAmount)}</dd>
                </div>
                <div>
                  <dt className="text-[#667085]">Palack</dt>
                  <dd className="font-bold">{submission.detectedBottleCount ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#667085]">Azonosító</dt>
                  <dd className="font-bold">{submission.detectedReceiptIdentifier ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#667085]">Dátum</dt>
                  <dd className="font-bold">{submission.detectedReceiptDate ?? '—'}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E8ECF2] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-extrabold">Kézi felülvizsgálat</h2>
        <p className="mt-1 text-sm text-[#667085]">
          Ellenőrizd a képen látható mennyiséget. Eltérésnél vagy javításkérésnél írj rövid, érthető
          indoklást.
        </p>
        <div className="mt-5">
          <ReviewForm
            canCorrect={administrator.role !== 'reviewer'}
            submissionId={submission.id}
            version={submission.version}
            status={submission.status}
            detectedAmount={submission.detectedAmount}
            detectedBottleCount={
              submission.approvedBottleCount ??
              submission.submittedBottleCount ??
              submission.detectedBottleCount
            }
            detectedReceiptIdentifier={submission.detectedReceiptIdentifier}
            detectedReceiptDate={submission.returnedOn ?? submission.detectedReceiptDate}
          />
        </div>
      </div>

      {!!revisions?.length && (
        <section className="mt-6 rounded-2xl bg-white p-5">
          <h2 className="font-bold">Korábbi feltöltések</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {revisions.map((r) => (
              <a
                key={r.id}
                href={`/api/admin/submissions/${submission.id}/receipt?revision=${r.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-blue-600"
              >
                {r.version}. változat · {r.bottle_count} palack
              </a>
            ))}
          </div>
        </section>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold">Jelzések</h2>
          {submission.flags.length === 0 ? (
            <p className="mt-3 text-sm text-[#667085]">Nincs ismétlődésre utaló jelzés.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {submission.flags.map((flag) => (
                <li key={flag.id} className="rounded-xl bg-amber-50 p-3 text-sm">
                  <strong>{flag.type}</strong> · súlyosság {flag.severity}/5 · pont {flag.score}
                  <pre className="mt-2 overflow-auto text-[10px] text-amber-900">
                    {JSON.stringify(flag.details, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold">Változtathatatlan auditnapló</h2>
          {submission.reviews.length === 0 ? (
            <p className="mt-3 text-sm text-[#667085]">Még nincs felülvizsgálati bejegyzés.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {submission.reviews.map((review) => (
                <li key={review.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="font-bold">
                    {statusLabels[review.from_status]} → {statusLabels[review.to_status]}
                  </div>
                  <div className="mt-1 text-xs text-[#667085]">
                    {formatDateTime(review.created_at)} · ellenőr {review.reviewer_id.slice(0, 8)}…
                  </div>
                  {review.approved_amount === null ? null : (
                    <div className="mt-1 text-xs">
                      {formatAmount(review.approved_amount)} · {review.approved_bottle_count} palack
                    </div>
                  )}
                  {review.reason ? (
                    <div className="mt-1 text-xs">Indok: {review.reason}</div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
