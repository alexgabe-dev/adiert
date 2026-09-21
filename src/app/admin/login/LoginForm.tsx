'use client';

import { useActionState } from 'react';

import { signInAction } from './actions';
import { initialSignInState } from './shared';

export function LoginForm({ localPassword = false }: { localPassword?: boolean }) {
  const [state, formAction, pending] = useActionState(signInAction, initialSignInState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="mode" value={localPassword ? 'password' : 'email'} />
      <div>
        <label htmlFor="admin-email" className="mb-2 block text-sm font-bold text-[#0B1535]">
          Admin e-mail-cím
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-[#D7DDEA] bg-white px-4 py-3 text-[#0B1535] outline-none transition focus:border-[#246BFD] focus:ring-4 focus:ring-blue-100"
          placeholder="nev@pelda.hu"
        />
      </div>

      {localPassword && (
        <label className="block text-sm font-bold text-[#0B1535]">
          Jelszó
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field mt-2"
          />
        </label>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#246BFD] px-5 py-3 font-extrabold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246BFD] disabled:cursor-wait disabled:opacity-60"
      >
        {pending
          ? 'Egy pillanat…'
          : localPassword
            ? 'Belépek az adminfelületre'
            : 'Belépési hivatkozás kérése'}
      </button>

      {state.message ? (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            state.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
