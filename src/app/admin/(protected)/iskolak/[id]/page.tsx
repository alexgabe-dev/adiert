import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { AdminFlash } from '@/components/admin/AdminFlash';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { SchoolForm } from '@/components/admin/SchoolForm';
import { TeamPanel } from '@/components/teacher/TeamPanel';
import { setSchoolActiveAction, updateSchoolAction } from '@/features/admin/control-actions';
import { getSchool } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Membership, SchoolInvitation, TeacherSubmission } from '@/features/teacher/server';
import { statusLabels } from '@/features/teacher/shared';
const tabs = [
  ['overview', 'Áttekintés'],
  ['review', 'Ellenőrzés'],
  ['contacts', 'Kapcsolattartók'],
  ['data', 'Iskola adatai'],
  ['history', 'Előzmények'],
];
export default async function SchoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdministratorRole('admin');
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Nincs adatbázis-kapcsolat.');
  const p = await searchParams;
  const tab = tabs.some(([key]) => key === p.tab) ? p.tab : 'overview';
  const page = Math.max(1, Number(p.page) || 1);
  const school = await getSchool(client, id);
  if (!school) notFound();
  const [cards, members, invites] = await Promise.all([
    client.rpc('admin_school_cards', { p_ids: [id] }),
    client.from('school_memberships').select('*').eq('school_id', id),
    client
      .from('school_invitations')
      .select('*')
      .eq('school_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);
  if (cards.error || members.error || invites.error)
    throw new Error('Az iskola adatai nem tölthetők be.');
  const stats = (
    cards.data as {
      approved: number;
      pending_count: number;
      pending_bottles: number;
      teacher_count: number;
      owner_name: string | null;
      owner_email: string | null;
    }[]
  )[0];
  let reviewQuery = client
    .from('submissions')
    .select(
      'id,public_reference,school_id,status,submitted_bottle_count,approved_bottle_count,returned_on,teacher_note,feedback,version,created_at,submitted_by',
      { count: 'exact' },
    )
    .eq('school_id', id)
    .order('created_at', { ascending: false });
  if (['pending', 'needs_review', 'approved', 'rejected'].includes(p.status ?? ''))
    reviewQuery = reviewQuery.eq('status', p.status!);
  const reviews =
    tab === 'review'
      ? await reviewQuery.range((page - 1) * 20, page * 20 - 1)
      : { data: [], error: null, count: 0 };
  const events =
    tab === 'history'
      ? await client
          .from('portal_events')
          .select('*', { count: 'exact' })
          .eq('school_id', id)
          .order('created_at', { ascending: false })
          .range((page - 1) * 30, page * 30 - 1)
      : { data: [], error: null, count: 0 };
  if (reviews.error || events.error) throw new Error('Az előzmények nem tölthetők be.');
  return (
    <section>
      <Link href="/admin/iskolak" className="text-sm font-bold text-blue-600">
        ← Iskolák
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">{school.name}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {school.city} · {school.active ? 'Aktív' : 'Szüneteltetve'}
      </p>
      <AdminFlash success={p.success} error={p.error} />
      <nav aria-label="Iskolai adatlap" className="my-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/iskolak/${id}?tab=${key}`}
            aria-current={tab === key ? 'page' : undefined}
            className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold ${tab === key ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white'}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['Jóváhagyott palack', stats?.approved ?? 0],
              ['Ellenőrzésre váró beküldés', stats?.pending_count ?? 0],
              ['Ellenőrzésre váró palack', stats?.pending_bottles ?? 0],
              ['További tanár', stats?.teacher_count ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-5">
                <p className="text-2xl font-extrabold">{Number(value).toLocaleString('hu-HU')}</p>
                <p className="mt-2 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-white p-6">
            <h2 className="font-bold">Fő kapcsolattartó</h2>
            <p className="mt-3">{stats?.owner_name ?? 'Még nincs jóváhagyott kapcsolattartó'}</p>
            <p className="mt-1 break-all text-sm text-slate-500">{stats?.owner_email}</p>
          </div>
          <a
            href={`/api/admin/schools/${id}/export`}
            className="mt-5 inline-block rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold"
          >
            Beküldések exportálása CSV-be
          </a>
        </>
      )}
      {tab === 'contacts' && (
        <TeamPanel
          schoolId={id}
          members={(members.data ?? []) as Membership[]}
          invitations={(invites.data ?? []) as SchoolInvitation[]}
          canManage
          isAdmin
        />
      )}
      {tab === 'data' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6">
            <SchoolForm action={updateSchoolAction} school={school} />
          </div>
          <ConfirmAction
            action={setSchoolActiveAction}
            fields={{ school_id: id, active: String(!school.active) }}
            triggerLabel={school.active ? 'Iskola szüneteltetése' : 'Iskola aktiválása'}
            title="Iskola állapotának módosítása"
            description="A szüneteltetett iskola tanárai nem tölthetnek fel. A korábbi beküldések és eredmények megmaradnak."
            confirmLabel="Módosítás"
            tone="danger"
          />
        </div>
      )}
      {tab === 'review' && (
        <>
          <form className="mb-5 flex max-w-md gap-2">
            <input type="hidden" name="tab" value="review" />
            <select
              name="status"
              aria-label="Beküldés állapota"
              defaultValue={p.status ?? ''}
              className="field"
            >
              <option value="">Minden állapot</option>
              {['pending', 'needs_review', 'approved', 'rejected'].map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-white px-4 font-bold">Szűrés</button>
          </form>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {((reviews.data ?? []) as TeacherSubmission[]).map((s) => (
              <Link
                key={s.id}
                href={`/admin/bekuldesek/${s.id}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/submissions/${s.id}/receipt`}
                  alt="Ellenőrizendő képernyőfotó"
                  loading="lazy"
                  className="h-44 w-full bg-slate-100 object-contain"
                />
                <div className="p-4">
                  <p className="text-xl font-extrabold">{s.submitted_bottle_count ?? '—'} palack</p>
                  <p className="mt-2 text-sm font-bold text-blue-600">{statusLabels[s.status]}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {s.returned_on ?? s.created_at.slice(0, 10)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {!reviews.data?.length && (
            <p className="rounded-2xl bg-white p-6">Nincs ilyen beküldés.</p>
          )}
        </>
      )}
      {tab === 'history' && (
        <ol className="space-y-3">
          {events.data?.map((e) => (
            <li key={e.id} className="rounded-2xl bg-white p-5">
              <p className="font-bold">{e.action}</p>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(e.created_at).toLocaleString('hu-HU')} · {e.actor_id}
              </p>
              {Object.keys(e.detail ?? {}).length > 0 && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs">
                  {JSON.stringify(e.detail, null, 2)}
                </pre>
              )}
            </li>
          ))}
          {!events.data?.length && (
            <li className="rounded-2xl bg-white p-6">Még nincs bejegyzés.</li>
          )}
        </ol>
      )}
      {['review', 'history'].includes(tab ?? '') && (
        <div className="mt-6 flex justify-between text-sm font-bold text-blue-600">
          {page > 1 ? (
            <Link
              href={`/admin/iskolak/${id}?tab=${tab}&status=${p.status ?? ''}&page=${page - 1}`}
            >
              ← Előző
            </Link>
          ) : (
            <span />
          )}
          {page * (tab === 'review' ? 20 : 30) <
            (tab === 'review' ? (reviews.count ?? 0) : (events.count ?? 0)) && (
            <Link
              href={`/admin/iskolak/${id}?tab=${tab}&status=${p.status ?? ''}&page=${page + 1}`}
            >
              Következő →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
