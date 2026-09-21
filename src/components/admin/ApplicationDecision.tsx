'use client';
import { useState } from 'react';
import { SchoolCombobox } from '@/components/forms/SchoolCombobox';
import type { SchoolSelection } from '@/features/public-data/types';
import type { SchoolApplication } from '@/features/teacher/server';
import { ActionForm } from '@/components/teacher/ActionForm';
import { decideApplication } from '@/features/admin/portal-actions';
export function ApplicationDecision({ application: a }: { application: SchoolApplication }) {
  const [school, setSchool] = useState<SchoolSelection | null>(null);
  return (
    <ActionForm
      action={decideApplication}
      label="Döntés mentése"
      confirm="Elmented a döntést és sorba állítod az értesítő e-mailt?"
    >
      <input type="hidden" name="id" value={a.id} />
      <input type="hidden" name="version" value={a.version} />
      <input type="hidden" name="school" value={school?.id ?? a.school_id ?? ''} />
      <label className="block text-sm font-bold">Iskola összekapcsolása (ha módosítani kell)</label>
      <SchoolCombobox rememberSelection={false} campaignId="" value={school} onChange={setSchool} />
      <label className="block text-sm font-bold">
        Döntés
        <select name="status" className="field mt-2">
          <option value="approved">Regisztráció elfogadása</option>
          <option value="needs_changes">Pontosítást kérek</option>
          <option value="rejected">Elutasítás</option>
        </select>
      </label>
      <label className="block text-sm font-bold">
        Indoklás / visszajelzés
        <textarea
          name="reason"
          maxLength={500}
          rows={3}
          className="field mt-2"
          placeholder="Pontosításkérésnél és elutasításnál kötelező."
        />
      </label>
    </ActionForm>
  );
}
