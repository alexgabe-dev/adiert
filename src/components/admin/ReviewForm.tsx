'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { initialReviewActionState, reviewSubmissionAction } from '@/features/admin/review-action';
import type { SubmissionStatus } from '@/features/admin/submissions';

interface ReviewFormProps {
  submissionId: string;
  version: number;
  status: SubmissionStatus;
  detectedAmount: number | null;
  detectedBottleCount: number | null;
  detectedReceiptIdentifier: string | null;
  detectedReceiptDate: string | null;
}

export function ReviewForm({
  submissionId,
  version,
  status,
  detectedAmount,
  detectedBottleCount,
  detectedReceiptIdentifier,
  detectedReceiptDate,
}: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(
    reviewSubmissionAction,
    initialReviewActionState,
  );
  const router = useRouter();
  const isFinal = status === 'approved' || status === 'rejected';

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [router, state.status]);

  if (isFinal) {
    return (
      <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
        Ez a beküldés végleges állapotban van. Phase 3-ban visszafordítás nem engedélyezett.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="expected_version" value={version} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="approved-amount" className="mb-1.5 block text-sm font-bold">
            Jóváhagyott összeg (Ft)
          </label>
          <input
            id="approved-amount"
            name="approved_amount"
            type="number"
            min="1"
            step="1"
            defaultValue={detectedAmount ?? ''}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="approved-bottles" className="mb-1.5 block text-sm font-bold">
            Jóváhagyott palackszám
          </label>
          <input
            id="approved-bottles"
            name="approved_bottle_count"
            type="number"
            min="1"
            step="1"
            defaultValue={detectedBottleCount ?? ''}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="receipt-identifier" className="mb-1.5 block text-sm font-bold">
            Bizonylatazonosító (ha olvasható)
          </label>
          <input
            id="receipt-identifier"
            name="receipt_identifier"
            type="text"
            maxLength={200}
            defaultValue={detectedReceiptIdentifier ?? ''}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="receipt-date" className="mb-1.5 block text-sm font-bold">
            Bizonylat dátuma (ha olvasható)
          </label>
          <input
            id="receipt-date"
            name="receipt_date"
            type="date"
            defaultValue={detectedReceiptDate ?? ''}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="review-reason" className="mb-1.5 block text-sm font-bold">
          Indoklás / megjegyzés
        </label>
        <textarea
          id="review-reason"
          name="reason"
          rows={3}
          maxLength={500}
          placeholder="Elutasításnál kötelező; további ellenőrzésnél ajánlott."
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {state.message ? (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            state.status === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="submit"
          name="intent"
          value="approved"
          disabled={pending}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Jóváhagyás
        </button>
        <button
          type="submit"
          name="intent"
          value="rejected"
          disabled={pending}
          className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          Elutasítás
        </button>
        <button
          type="submit"
          name="intent"
          value="needs_review"
          disabled={pending || status === 'needs_review'}
          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          További ellenőrzés
        </button>
      </div>
    </form>
  );
}
