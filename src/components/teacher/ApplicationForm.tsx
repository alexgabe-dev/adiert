'use client';
import { useState } from 'react';
import { SchoolCombobox } from '@/components/forms/SchoolCombobox';
import type { SchoolSelection } from '@/features/public-data/types';
import type { SchoolApplication } from '@/features/teacher/server';
import { ActionForm, Field } from './ActionForm';
import { applySchoolAction } from '@/features/teacher/actions';
export function ApplicationForm({ application }: { application?: SchoolApplication | null }) {
  const [school, setSchool] = useState<SchoolSelection | null>(null);
  const [manual, setManual] = useState(false);
  return (
    <ActionForm
      action={applySchoolAction}
      label="Jelentkezés beküldése"
      disabled={!school && !manual && !application}
    >
      <label htmlFor="application-school" className="block text-sm font-bold">
        Keresd meg az iskoládat
      </label>
      <SchoolCombobox
        rememberSelection={false}
        id="application-school"
        campaignId=""
        value={school}
        onChange={(s) => {
          setSchool(s);
          setManual(false);
        }}
      />
      <button
        type="button"
        onClick={() => {
          setSchool(null);
          setManual(!manual);
        }}
        className="min-h-11 text-sm font-semibold text-blue-600"
      >
        {manual ? 'Vissza az iskolakeresőhöz' : 'Nem találom az iskolámat, megadom az adatait'}
      </button>
      <input
        type="hidden"
        name="school_id"
        value={school?.id ?? (manual ? '' : (application?.school_id ?? ''))}
      />
      {(school || manual || application) && (
        <div key={school?.id ?? 'manual'} className="space-y-4">
          <Field
            label="Iskola hivatalos neve"
            name="school_name"
            value={school?.name ?? application?.school_name}
            maxLength={240}
          />
          <div className="grid grid-cols-1 sm:grid-cols-[100px_minmax(0,1fr)] gap-3">
            <Field
              label="Irányítószám"
              name="postal_code"
              pattern="[0-9]{4}"
              value={application?.postal_code}
            />
            <Field
              label="Település"
              name="city"
              value={school?.city ?? application?.city}
              maxLength={120}
            />
          </div>
          <Field
            label="Kapcsolattartó teljes neve"
            name="contact_name"
            value={application?.contact_name}
            maxLength={120}
          />
          <p className="rounded-xl bg-blue-50 p-4 text-sm leading-relaxed text-blue-950">
            Elfogadás után te leszel az iskola adminja. Legfeljebb 10 további tanárt hívhatsz meg a
            csapatba.
          </p>
        </div>
      )}
    </ActionForm>
  );
}
