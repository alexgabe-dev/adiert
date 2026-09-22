'use client';
import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { initialActionState, type ActionState } from '@/features/teacher/shared';
export function ActionForm({
  action,
  children,
  label = 'Mentés',
  className = 'space-y-4',
  confirm,
  tone = 'primary',
  disabled = false,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  label?: string;
  className?: string;
  confirm?: string;
  tone?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, initialActionState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef<FormData | null>(null);
  const confirmed = useRef(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmId = useId();
  useEffect(() => {
    if (state.status === 'success') router.refresh();
    if (state.status === 'error' && submitted.current && formRef.current) {
      for (const element of Array.from(formRef.current.elements)) {
        if (!(
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ))
          continue;
        if (
          element instanceof HTMLInputElement &&
          ['file', 'hidden', 'checkbox', 'radio'].includes(element.type)
        )
          continue;
        const value = submitted.current.get(element.name);
        if (typeof value === 'string') element.value = value;
      }
    }
  }, [state, router]);
  return (
    <>
      <form
        ref={formRef}
        action={submit}
        aria-busy={pending}
        className={className}
        onSubmit={(e) => {
          if (pending || disabled) {
            e.preventDefault();
            return;
          }
          if (confirm && !confirmed.current) {
            e.preventDefault();
            setShowConfirm(true);
            return;
          }
          confirmed.current = false;
          submitted.current = new FormData(e.currentTarget);
        }}
      >
        {children}
        {state.message && (
          <p
            role={state.status === 'error' ? 'alert' : 'status'}
            className={`rounded-xl p-3 text-sm ${state.status === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}
          >
            {state.message}
          </p>
        )}
        <button
          disabled={pending || disabled}
          className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${tone === 'danger' ? 'border border-rose-200 text-rose-700 hover:bg-rose-50' : tone === 'secondary' ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {pending ? 'Egy pillanat…' : label}
        </button>
      </form>
      {showConfirm && (
        <ModalDialog
          labelId={confirmId}
          onClose={() => setShowConfirm(false)}
          className="max-w-sm rounded-3xl p-6"
        >
          <h2 id={confirmId} className="text-xl font-bold">
            {label}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{confirm}</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              data-autofocus
              onClick={() => setShowConfirm(false)}
              className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-bold"
            >
              Mégsem
            </button>
            <button
              type="button"
              onClick={() => {
                confirmed.current = true;
                setShowConfirm(false);
                formRef.current?.requestSubmit();
              }}
              className={`min-h-12 flex-1 rounded-xl px-4 text-sm font-bold text-white ${tone === 'danger' ? 'bg-rose-600' : 'bg-blue-600'}`}
            >
              Megerősítem
            </button>
          </div>
        </ModalDialog>
      )}
    </>
  );
}
export function Field({
  label,
  name,
  type = 'text',
  value,
  required = true,
  ...props
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  min?: string;
  max?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm font-bold">
      <span className="mb-2 block">{label}</span>
      <span className="relative block">
        <input
          name={name}
          type={type === 'password' && visible ? 'text' : type}
          defaultValue={value}
          required={required}
          className={`field text-base ${type === 'password' ? 'pr-12' : ''}`}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:text-blue-600"
          >
            {visible ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        )}
      </span>
    </label>
  );
}
