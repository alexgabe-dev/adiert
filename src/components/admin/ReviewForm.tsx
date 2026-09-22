'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { reviewSubmissionAction } from '@/features/admin/review-action';
import { initialReviewActionState } from '@/features/admin/review-state';
import type { SubmissionStatus } from '@/features/admin/submissions';

interface ReviewFormProps {
  canCorrect?: boolean;
  submissionId: string;
  version: number;
  status: SubmissionStatus;
  detectedAmount: number | null;
  detectedBottleCount: number | null;
  detectedReceiptIdentifier: string | null;
  detectedReceiptDate: string | null;
}

export function ReviewForm({
  canCorrect = false,
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
  const [bottles, setBottles] = useState(detectedBottleCount?.toString() ?? '');
  const [reason, setReason] = useState('');
  const [validation, setValidation] = useState('');
  const isFinal = status === 'approved' || status === 'rejected';

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [router, state.status]);

  if (isFinal && !canCorrect) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="font-bold">
          {status === 'approved' ? 'A gyűjtés jóváhagyva.' : 'A beküldés elutasítva.'}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {canCorrect
            ? 'A döntés mentve van. Ha utólag hibát találsz, indoklással módosíthatod.'
            : 'A döntés mentve van. Korrekciót a főadmin végezhet.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/bekuldesek"
            className="flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
          >
            Vissza az ellenőrzési listához
          </Link>
        </div>
      </div>
    );
  }

  const form = (
    <form
      action={formAction}
      className="space-y-5"
      onSubmit={(event) => {
        const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value');
        if (
          (intent !== 'approved' || isFinal || Number(bottles) !== detectedBottleCount) &&
          !reason.trim()
        ) {
          event.preventDefault();
          setValidation('Írd le röviden az indoklást. Ezt a tanár is látni fogja.');
          event.currentTarget.querySelector<HTMLTextAreaElement>('#review-reason')?.focus();
        } else setValidation('');
      }}
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="expected_version" value={version} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="approved-amount" className="mb-1.5 block text-sm font-bold">
            Összeg (palackszám × 50 Ft)
          </label>
          <input
            id="approved-amount"
            name="approved_amount"
            type="number"
            min="1"
            step="1"
            value={bottles ? Number(bottles) * 50 : (detectedAmount ?? '')}
            readOnly
            className="field bg-slate-50 text-slate-600"
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
            max="100000"
            step="1"
            value={bottles}
            onChange={(e) => setBottles(e.target.value)}
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
          Visszajelzés a tanárnak
        </label>
        <textarea
          id="review-reason"
          name="reason"
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Például: a darabszám nem olvasható, kérlek, tölts fel egy élesebb fotót."
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Javításkérésnél, elutasításnál és az eredmény módosításánál kötelező.
        </p>
      </div>
      {validation && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {validation}
        </p>
      )}

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

      <div className="review-actions sticky bottom-0 z-20 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:grid-cols-3">
        <button
          type="submit"
          name="intent"
          value="approved"
          disabled={pending}
          className="col-span-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 sm:col-span-1"
        >
          {pending ? 'Mentés…' : isFinal ? 'Eredmény mentése' : 'Jóváhagyás'}
        </button>
        <button
          type="submit"
          name="intent"
          value="rejected"
          disabled={pending}
          className="order-3 rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          Elutasítás
        </button>
        <button
          type="submit"
          name="intent"
          value="needs_review"
          disabled={pending}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
        >
          Javítást kérek
        </button>
      </div>
    </form>
  );
  return isFinal ? (
    <div>
      <p className="text-sm font-semibold text-slate-700">
        {status === 'approved' ? 'A gyűjtés jóváhagyva.' : 'A beküldés elutasítva.'}
      </p>
      <Link
        href="/admin/bekuldesek"
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
      >
        Vissza az ellenőrzési listához
      </Link>
      <details className="mt-5 rounded-2xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">
          Döntés módosítása
        </summary>
        <p className="my-4 text-sm leading-6 text-slate-500">
          A módosítás az iskola eredményét is megváltoztatja. Írd le, miért szükséges a korrekció.
        </p>
        {form}
      </details>
    </div>
  ) : (
    form
  );
}
