'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Camera, CheckCircle2, Upload, X } from 'lucide-react';

import { ModalDialog } from '@/components/ui/ModalDialog';
import { acceptedReceiptMimeTypes, MAX_RECEIPT_FILE_BYTES } from '@/features/submissions/constants';
import { launchConfetti } from '@/lib/confetti';

interface SubmitReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSchool?: string;
}

interface SubmissionOptions {
  campaign: { id: string; name: string };
  schools: Array<{ id: string; name: string; city: string }>;
}

type Step = 'form' | 'submitting' | 'success';

const errorMessages: Record<string, string> = {
  invalid_image: 'A kiválasztott fájl nem olvasható képként.',
  invalid_request: 'A beküldés adatai érvénytelenek. Ellenőrizd az űrlapot.',
  invalid_selection: 'A kiválasztott iskola vagy kampány már nem aktív.',
  invalid_dimensions: 'A kép mérete vagy felbontása nem megfelelő.',
  missing_image: 'Válassz ki egy bizonylatképet.',
  oversized_file: 'A kép mérete legfeljebb 10 MB lehet.',
  rate_limited: 'Túl sok beküldési kísérlet érkezett. Próbáld újra később.',
  submission_failed: 'A beküldést most nem sikerült menteni. Próbáld újra.',
  unavailable: 'A beküldés átmenetileg nem érhető el. Próbáld újra később.',
  unsupported_type: 'Csak JPEG, PNG vagy WebP kép tölthető fel.',
};

function isSubmissionOptions(value: unknown): value is SubmissionOptions {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SubmissionOptions>;
  return (
    typeof candidate.campaign?.id === 'string' &&
    typeof candidate.campaign.name === 'string' &&
    Array.isArray(candidate.schools) &&
    candidate.schools.every(
      (school) =>
        typeof school?.id === 'string' &&
        typeof school.name === 'string' &&
        typeof school.city === 'string',
    )
  );
}

export const SubmitReceiptModal: React.FC<SubmitReceiptModalProps> = ({
  isOpen,
  onClose,
  defaultSchool = '',
}) => {
  const [step, setStep] = useState<Step>('form');
  const [options, setOptions] = useState<SubmissionOptions | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [publicReference, setPublicReference] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();

    void fetch('/api/submissions/options', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('options');
        const body: unknown = await response.json();
        if (!isSubmissionOptions(body)) throw new Error('options');
        setOptions(body);
        const preferredSchool = body.schools.find((school) => school.name === defaultSchool);
        setSelectedSchoolId(preferredSchool?.id ?? body.schools[0]?.id ?? '');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setOptionsError(true);
      });

    return () => controller.abort();
  }, [defaultSchool, isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectedSchool = useMemo(
    () => options?.schools.find((school) => school.id === selectedSchoolId) ?? null,
    [options, selectedSchoolId],
  );

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setErrorMessage('');
    if (!file) {
      setReceiptFile(null);
      setPreviewUrl(null);
      return;
    }
    if (
      !acceptedReceiptMimeTypes.includes(file.type as (typeof acceptedReceiptMimeTypes)[number])
    ) {
      setReceiptFile(null);
      setPreviewUrl(null);
      setErrorMessage(errorMessages.unsupported_type ?? 'Nem támogatott fájltípus.');
      return;
    }
    if (file.size > MAX_RECEIPT_FILE_BYTES) {
      setReceiptFile(null);
      setPreviewUrl(null);
      setErrorMessage(errorMessages.oversized_file ?? 'A fájl túl nagy.');
      return;
    }
    setReceiptFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (!receiptFile) {
      setErrorMessage(errorMessages.missing_image ?? 'Válassz ki egy képet.');
      return;
    }
    if (!options || !selectedSchoolId) {
      setErrorMessage('Válassz egy aktív iskolát.');
      return;
    }

    setStep('submitting');
    const formData = new FormData();
    formData.set('receipt', receiptFile);
    formData.set('school_id', selectedSchoolId);
    formData.set('campaign_id', options.campaign.id);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      const body: unknown = await response.json();
      const parsedBody = body as { error?: unknown; publicReference?: unknown; status?: unknown };
      if (
        !response.ok ||
        typeof parsedBody.publicReference !== 'string' ||
        parsedBody.status !== 'pending'
      ) {
        const errorCode =
          typeof parsedBody.error === 'string' ? parsedBody.error : 'submission_failed';
        throw new Error(errorCode);
      }

      setPublicReference(parsedBody.publicReference);
      setStep('success');
      void launchConfetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#246BFD', '#34C759', '#FFB020'],
      });
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'submission_failed';
      setErrorMessage(
        errorMessages[errorCode] ?? errorMessages.submission_failed ?? 'Hiba történt.',
      );
      setStep('form');
    }
  };

  return (
    <ModalDialog
      labelId="submit-receipt-title"
      descriptionId="submit-receipt-description"
      onClose={onClose}
      className="max-h-[92vh] max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        data-autofocus
        className="absolute top-5 right-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Bezárás"
      >
        <X className="h-5 w-5" />
      </button>

      {step === 'form' && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-blue-600 uppercase">
            <Camera className="h-4 w-4" />
            <span>Gyűjtés beküldése</span>
          </div>
          <h3 id="submit-receipt-title" className="mb-2 text-2xl font-extrabold text-[#0B1535]">
            Bizonylat feltöltése
          </h3>
          <p id="submit-receipt-description" className="mb-6 text-xs text-[#667085] sm:text-sm">
            Tölts fel egy éles bizonylatfotót, majd válaszd ki az iskolát. A beküldés kézi
            ellenőrzésre kerül.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0B1535]">
                REpont bizonylat fotója <span className="text-rose-500">*</span>
              </label>
              {receiptFile && previewUrl ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-3">
                    {/* Private local object URL preview; it is never uploaded as base64. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="A kiválasztott bizonylat előnézete"
                      className="h-14 w-14 rounded-xl bg-white object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-emerald-950">
                        Bizonylat kiválasztva
                      </div>
                      <div className="truncate text-[11px] text-emerald-700">
                        {(receiptFile.size / 1024 / 1024).toFixed(2)} MB · ellenőrzés a beküldéskor
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null);
                        setPreviewUrl(null);
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Módosítás
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-colors hover:border-blue-400">
                  <input
                    type="file"
                    id="receipt-file-input"
                    accept={acceptedReceiptMimeTypes.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="receipt-file-input"
                    className="flex cursor-pointer flex-col items-center justify-center"
                  >
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-[#0B1535] sm:text-sm">
                      Kattints a fotó kiválasztásához vagy készítéséhez
                    </span>
                    <span className="mt-0.5 text-[11px] text-[#667085]">
                      JPEG, PNG vagy WebP · legfeljebb 10 MB
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="receipt-school"
                className="mb-1.5 block text-xs font-bold text-[#0B1535]"
              >
                Iskola kiválasztása <span className="text-rose-500">*</span>
              </label>
              <select
                id="receipt-school"
                value={selectedSchoolId}
                onChange={(event) => setSelectedSchoolId(event.target.value)}
                disabled={!options || options.schools.length === 0}
                required
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-[#0B1535] focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {!options ? <option value="">Iskolák betöltése…</option> : null}
                {options?.schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.city})
                  </option>
                ))}
              </select>
              {options ? (
                <p className="mt-1 text-[11px] text-[#667085]">
                  Aktív kampány: {options.campaign.name}
                </p>
              ) : null}
            </div>

            {optionsError ? (
              <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Az aktív iskolák most nem tölthetők be. Zárd be az ablakot, majd próbáld újra.
              </p>
            ) : null}

            {errorMessage ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            ) : null}

            <p className="text-[11px] leading-5 text-[#667085]">
              A böngésző nem küld összeget, palackszámot vagy jóváhagyási állapotot. Ezeket
              kizárólag az adminisztrátori ellenőrzés rögzítheti.
            </p>

            <button
              type="submit"
              disabled={!receiptFile || !selectedSchoolId || optionsError}
              className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              <span>Bizonylat beküldése ellenőrzésre</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {step === 'submitting' && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <h4 id="submit-receipt-title" className="mb-1 text-lg font-bold text-[#0B1535]">
            Biztonságos feltöltés folyamatban…
          </h4>
          <p id="submit-receipt-description" className="text-xs text-[#667085]">
            A szerver ellenőrzi és biztonságos formátumba alakítja a képet, majd függőben lévő
            beküldést hoz létre.
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-xs">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h3 id="submit-receipt-title" className="mb-2 text-2xl font-extrabold text-[#0B1535]">
            Beküldés fogadva
          </h3>
          <p
            id="submit-receipt-description"
            className="mb-6 max-w-sm text-xs text-[#667085] sm:text-sm"
          >
            A bizonylatot biztonságosan fogadtuk, és kézi ellenőrzésre vár. Ez még nem jelent
            jóváhagyott adományt, és az iskola eredménye még nem változott.
          </p>

          <div className="mb-6 w-full space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-[#667085]">Iskola:</span>
              <strong className="text-right text-[#0B1535]">{selectedSchool?.name}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#667085]">Állapot:</span>
              <strong className="text-amber-700">Ellenőrzésre vár</strong>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <span className="text-[#667085]">Hivatkozás:</span>
              <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-[10px] text-[#0B1535]">
                {publicReference}
              </code>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B1535] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            <span>Vissza a főoldalra</span>
          </button>
        </div>
      )}
    </ModalDialog>
  );
};
