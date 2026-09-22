'use client';

import { useId, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { ModalDialog } from '@/components/ui/ModalDialog';

interface ConfirmActionProps {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  compact?: boolean;
}

export function ConfirmAction({
  action,
  fields,
  triggerLabel,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  compact = false,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const triggerClass =
    tone === 'danger'
      ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
      : 'border-slate-200 text-[#0B1535] hover:bg-slate-50';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center justify-center rounded-xl border bg-white font-bold ${compact ? 'px-3 text-xs' : 'px-4 text-sm'} ${triggerClass}`}
      >
        {triggerLabel}
      </button>
      {open ? (
        <ModalDialog
          labelId={titleId}
          descriptionId={descriptionId}
          onClose={() => setOpen(false)}
          className="max-w-md rounded-2xl p-6 sm:p-7"
        >
          <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
            {title}
          </h2>
          <p id={descriptionId} className="mt-3 text-sm leading-6 text-[#667085]">
            {description}
          </p>
          <form
            action={action}
            className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          >
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50"
            >
              Mégse
            </button>
            <ConfirmSubmit label={confirmLabel} tone={tone} />
          </form>
        </ModalDialog>
      ) : null}
    </>
  );
}

function ConfirmSubmit({ label, tone }: { label: string; tone: 'primary' | 'danger' }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`min-h-11 rounded-xl px-4 text-sm font-extrabold text-white disabled:opacity-50 ${tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {pending ? 'Mentés…' : label}
    </button>
  );
}
