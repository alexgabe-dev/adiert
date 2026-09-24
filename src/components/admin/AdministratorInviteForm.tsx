'use client';

import { useId, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { inviteAdministratorAction } from '@/features/admin/control-actions';
import type { AdministratorRole } from '@/lib/auth/roles';
import { ModalDialog } from '@/components/ui/ModalDialog';

const roleLabels: Record<AdministratorRole, string> = {
  reviewer: 'Reviewer',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

export function AdministratorInviteForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdministratorRole>('reviewer');
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (event.currentTarget.reportValidity()) setOpen(true);
        }}
      >
        <div>
          <label htmlFor="invite-email" className="mb-1.5 block text-sm font-bold">
            E-mail-cím
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="invite-role" className="mb-1.5 block text-sm font-bold">
            Szerepkör
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value as AdministratorRole)}
            className="field"
          >
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="min-h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white hover:bg-blue-700"
        >
          Meghívás előkészítése
        </button>
      </form>

      {open ? (
        <ModalDialog
          labelId={titleId}
          descriptionId={descriptionId}
          onClose={() => setOpen(false)}
          className="max-w-md rounded-2xl p-6 sm:p-7"
        >
          <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
            Adminisztrátor meghívása
          </h2>
          <p id={descriptionId} className="mt-3 text-sm leading-6 text-[#667085]">
            <strong>{email}</strong> meghívást és <strong>{roleLabels[role]}</strong> jogosultságot
            kap.
            {role === 'super_admin'
              ? ' Ez teljes admin- és jogosultságkezelési hozzáférést jelent.'
              : ''}
          </p>
          <form
            action={inviteAdministratorAction}
            className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          >
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="role" value={role} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50"
            >
              Mégse
            </button>
            <InviteSubmit role={role} />
          </form>
        </ModalDialog>
      ) : null}
    </>
  );
}

function InviteSubmit({ role }: { role: AdministratorRole }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`min-h-11 rounded-xl px-4 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-60 ${role === 'super_admin' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {pending ? 'Meghívó küldése…' : 'Meghívás és jogosultság'}
    </button>
  );
}
