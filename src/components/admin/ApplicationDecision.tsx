'use client';
import { useState } from 'react';
import { SchoolCombobox } from '@/components/forms/SchoolCombobox';
import type { SchoolSelection } from '@/features/public-data/types';
import type { SchoolApplication } from '@/features/teacher/server';
import { ActionForm } from '@/components/teacher/ActionForm';
import { decideApplication } from '@/features/admin/portal-actions';
export function ApplicationDecision({ application: a }: { application: SchoolApplication }) {
  const [school, setSchool] = useState<SchoolSelection | null>(null);
  const [decision, setDecision] = useState('approved');
  return (
    <ActionForm
      action={decideApplication}
      label="Döntés mentése"
      confirm={`Elmented a döntést ennél az iskolánál: ${a.school_name}? A kapcsolattartó látni fogja az állapotot és a visszajelzésedet.`}
    >
      <input type="hidden" name="id" value={a.id} />
      <input type="hidden" name="version" value={a.version} />
      <input type="hidden" name="school" value={school?.id ?? a.school_id ?? ''} />
      <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">
          Másik iskolához kapcsolom a jelentkezést
        </summary>
        <div className="mt-3">
          <label htmlFor={`application-school-${a.id}`} className="mb-2 block text-sm font-bold">
            Iskola keresése
          </label>
          <SchoolCombobox
            id={`application-school-${a.id}`}
            rememberSelection={false}
            campaignId=""
            value={school}
            onChange={setSchool}
          />
        </div>
      </details>
      <label className="block text-sm font-bold">
        Döntés
        <select
          name="status"
          value={decision}
          onChange={(event) => setDecision(event.target.value)}
          className="field mt-2"
        >
          <option value="approved">Regisztráció elfogadása</option>
          <option value="needs_changes">Pontosítást kérek</option>
          <option value="rejected">Elutasítás</option>
        </select>
      </label>
      <label className="block text-sm font-bold">
        Indoklás / visszajelzés
        <textarea
          name="reason"
          required={decision !== 'approved'}
          maxLength={500}
          rows={3}
          className="field mt-2"
          placeholder="Pontosításkérésnél és elutasításnál kötelező."
        />
      </label>
    </ActionForm>
  );
}
