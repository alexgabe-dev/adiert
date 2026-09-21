'use client';
import { useActionState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { initialActionState, type ActionState } from '@/features/teacher/shared';
export function ActionForm({
  action,
  children,
  label = 'Mentés',
  className = 'space-y-4',
  confirm,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  label?: string;
  className?: string;
  confirm?: string;
}) {
  const [state, submit, pending] = useActionState(action, initialActionState);
  const router = useRouter();
  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [state, router]);
  return (
    <form
      action={submit}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
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
        disabled={pending}
        className="min-h-12 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[.98] disabled:opacity-50"
      >
        {pending ? 'Egy pillanat…' : label}
      </button>
    </form>
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
  return (
    <label className="block text-sm font-bold">
      <span className="mb-2 block">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        className="field text-base"
        {...props}
      />
    </label>
  );
}
