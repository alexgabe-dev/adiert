import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { AdminFlash } from '@/components/admin/AdminFlash';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { SchoolForm } from '@/components/admin/SchoolForm';
import { setSchoolActiveAction, updateSchoolAction } from '@/features/admin/control-actions';
import { getSchool } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface SchoolPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function SchoolPage({ params, searchParams }: SchoolPageProps) {
  await requireAdministratorRole('admin');
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');
  const [school, parameters] = await Promise.all([getSchool(client, id), searchParams]);
  if (!school) notFound();
  const [submissionCount, campaignCount] = await Promise.all([
    client.from('submissions').select('id', { count: 'exact', head: true }).eq('school_id', id),
    client
      .from('campaign_schools')
      .select('campaign_id', { count: 'exact', head: true })
      .eq('school_id', id),
  ]);

  return (
    <section className="max-w-5xl">
      <Link href="/admin/iskolak" className="text-sm font-bold text-blue-600">
        ← Iskolák
      </Link>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">{school.name}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${school.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
            >
              {school.active ? 'Aktív' : 'Inaktív'}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#667085]">
            {school.city} · {school.county}
          </p>
        </div>
        <ConfirmAction
          action={setSchoolActiveAction}
          fields={{ school_id: id, active: String(!school.active) }}
          triggerLabel={school.active ? 'Iskola deaktiválása' : 'Iskola újraaktiválása'}
          title={school.active ? 'Iskola deaktiválása' : 'Iskola újraaktiválása'}
          description={
            school.active
              ? `${school.name} nem lesz választható új beküldéshez, és kikerül az aktív publikus nézetekből. ${submissionCount.count ?? 0} történeti beküldés és ${campaignCount.count ?? 0} kampánykapcsolat változatlanul megmarad.`
              : `${school.name} ismét elérhető lesz. A kampányrészvételeket ez nem aktiválja automatikusan.`
          }
          confirmLabel={school.active ? 'Deaktiválás' : 'Újraaktiválás'}
          tone={school.active ? 'danger' : 'primary'}
        />
      </div>
      <AdminFlash success={first(parameters.success)} error={first(parameters.error)} />
      <div className="mt-6 rounded-2xl border border-[#E8ECF2] bg-white p-5 sm:p-6">
        <h2 className="mb-5 text-lg font-extrabold">Biztonságosan szerkeszthető adatok</h2>
        <SchoolForm action={updateSchoolAction} school={school} />
      </div>
      <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-xs leading-5 text-slate-600">
        Végleges törlés nem érhető el. A történeti beküldések és kampánykapcsolatok megőrzését az
        adatbázis is kikényszeríti.
      </p>
    </section>
  );
}
