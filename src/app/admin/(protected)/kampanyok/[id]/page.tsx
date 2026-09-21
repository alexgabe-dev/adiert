import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { AdminFlash } from '@/components/admin/AdminFlash';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import {
  bulkCampaignSchoolsAction,
  saveCampaignAction,
  setCampaignActiveAction,
  setCampaignSchoolAction,
} from '@/features/admin/control-actions';
import { getCampaign, listSchools } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function CampaignPage({ params, searchParams }: Props) {
  await requireAdministratorRole('admin');
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');
  const query = await searchParams;
  const search = (first(query.q) ?? '').trim().slice(0, 120);
  const county = (first(query.county) ?? '').trim().slice(0, 80);
  const city = (first(query.city) ?? '').trim().slice(0, 80);
  const participation = ['all', 'selected', 'unselected'].includes(first(query.participation) ?? '')
    ? (first(query.participation) as 'all' | 'selected' | 'unselected')
    : 'all';
  const requestedPage = Number(first(query.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [campaign, schools, totalSchools] = await Promise.all([
    getCampaign(client, id),
    listSchools(client, {
      query: search,
      county,
      city,
      campaignId: id,
      participation,
      active: true,
      page,
      pageSize: 25,
    }),
    client.from('schools').select('id', { count: 'exact', head: true }).eq('active', true),
  ]);
  if (!campaign) notFound();
  const pageCount = Math.max(1, Math.ceil(schools.total / schools.pageSize));
  const filterFields = { campaign_id: id, query: search, county, city, participation };
  return (
    <section>
      <Link href="/admin/kampanyok" className="text-sm font-bold text-blue-600">
        ← Kampányok
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">{campaign.name}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${campaign.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
            >
              {campaign.active ? 'Aktív' : 'Inaktív'}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#667085]">
            {campaign.start_date} – {campaign.end_date} ·{' '}
            {campaign.target_amount.toLocaleString('hu-HU')} Ft
          </p>
        </div>
        <ConfirmAction
          action={setCampaignActiveAction}
          fields={{ campaign_id: id, active: campaign.active ? 'false' : 'true' }}
          triggerLabel={campaign.active ? 'Deaktiválás' : 'Aktiválás'}
          title={campaign.active ? 'Kampány deaktiválása' : 'Kampány aktiválása'}
          description={`${campaign.name} · ${campaign.start_date}–${campaign.end_date} · ${campaign.target_amount.toLocaleString('hu-HU')} Ft cél · ${campaign.participatingSchoolCount.toLocaleString('hu-HU')} résztvevő iskola. ${campaign.active ? 'A publikus kampányadatok inaktívvá válnak.' : 'Ha más kampány aktív, a rendszer nem deaktiválja automatikusan, hanem leállítja a műveletet.'}`}
          confirmLabel={campaign.active ? 'Kampány deaktiválása' : 'Kampány aktiválása'}
          tone={campaign.active ? 'danger' : 'primary'}
        />
      </div>
      <AdminFlash success={first(query.success)} error={first(query.error)} />
      <div className="mt-6 rounded-2xl border border-[#E8ECF2] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">Kampány adatai</h2>
        <form action={saveCampaignAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="campaign_id" value={id} />
          <Field label="Név" name="name" defaultValue={campaign.name} />
          <Field label="Slug" name="slug" defaultValue={campaign.slug} />
          <div className="lg:col-span-2">
            <label htmlFor="description" className="mb-1.5 block text-sm font-bold">
              Leírás
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={5000}
              defaultValue={campaign.description}
              className="field"
            />
          </div>
          <Field
            label="Célösszeg (Ft)"
            name="target_amount"
            type="number"
            defaultValue={String(campaign.target_amount)}
          />
          <Field label="Kezdés" name="start_date" type="date" defaultValue={campaign.start_date} />
          <Field label="Zárás" name="end_date" type="date" defaultValue={campaign.end_date} />
          <div className="lg:col-span-2">
            <button className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white">
              Változtatások mentése
            </button>
          </div>
        </form>
      </div>
      <div className="mt-6 rounded-2xl border border-[#E8ECF2] bg-white">
        <div className="border-b border-[#E8ECF2] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-extrabold">Résztvevő iskolák</h2>
              <p className="mt-1 text-sm text-[#667085]">
                <strong>{(totalSchools.count ?? 0).toLocaleString('hu-HU')}</strong> iskola az
                adatbázisban ·{' '}
                <strong>{campaign.participatingSchoolCount.toLocaleString('hu-HU')}</strong> részt
                vesz ebben a kampányban
              </p>
            </div>
            <ConfirmAction
              action={bulkCampaignSchoolsAction}
              fields={{
                ...filterFields,
                active: 'true',
                participation: 'all',
                query: '',
                county: '',
                city: '',
              }}
              triggerLabel="Összes aktív iskola hozzáadása"
              title="Összes aktív iskola hozzáadása"
              description={`${(totalSchools.count ?? 0).toLocaleString('hu-HU')} iskola kerül hozzáadásra a kampányhoz. A művelet tranzakciós, idempotens és auditált.`}
              confirmLabel="Iskolák hozzáadása"
            />
          </div>
          <form method="get" className="mt-5 grid gap-3 md:grid-cols-4">
            <input
              name="q"
              defaultValue={search}
              placeholder="Iskola neve vagy település"
              className="field"
            />
            <input name="city" defaultValue={city} placeholder="Település" className="field" />
            <input name="county" defaultValue={county} placeholder="Vármegye" className="field" />
            <select name="participation" defaultValue={participation} className="field">
              <option value="all">Mind</option>
              <option value="selected">Részt vesz</option>
              <option value="unselected">Nem vesz részt</option>
            </select>
            <button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold md:col-span-4 md:justify-self-start">
              Szűrés
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <ConfirmAction
              compact
              action={bulkCampaignSchoolsAction}
              fields={{ ...filterFields, active: 'true' }}
              triggerLabel="Összes szűrt hozzáadása"
              title="Szűrt iskolák hozzáadása"
              description={`${schools.total.toLocaleString('hu-HU')} szűrt iskola részvétele lesz aktív. A művelet idempotens és auditált.`}
              confirmLabel="Szűrt iskolák hozzáadása"
            />
            <ConfirmAction
              compact
              tone="danger"
              action={bulkCampaignSchoolsAction}
              fields={{ ...filterFields, active: 'false' }}
              triggerLabel="Összes szűrt eltávolítása"
              title="Szűrt részvételek deaktiválása"
              description={`${schools.total.toLocaleString('hu-HU')} szűrt iskola aktív részvétele kerül deaktiválásra. A korábbi kampánytörténet megmarad.`}
              confirmLabel="Részvételek deaktiválása"
            />
          </div>
        </div>
        {schools.items.length ? (
          <ul className="divide-y divide-slate-100">
            {schools.items.map((school) => (
              <li
                key={school.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-bold">{school.name}</p>
                  <p className="mt-1 text-xs text-[#667085]">
                    {school.city} · {school.county}
                  </p>
                </div>
                <ConfirmAction
                  compact
                  tone={school.participating ? 'danger' : 'primary'}
                  action={setCampaignSchoolAction}
                  fields={{
                    campaign_id: id,
                    school_id: school.id,
                    active: school.participating ? 'false' : 'true',
                  }}
                  triggerLabel={school.participating ? 'Eltávolítás' : 'Hozzáadás'}
                  title={school.participating ? 'Részvétel deaktiválása' : 'Iskola hozzáadása'}
                  description={`${school.name} ${school.participating ? 'kikerül az aktív résztvevők közül. A történeti adatok megmaradnak.' : 'résztvevő lesz ebben a kampányban.'}`}
                  confirmLabel={school.participating ? 'Eltávolítás' : 'Hozzáadás'}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-sm text-[#667085]">
            Nincs a szűrésnek megfelelő iskola.
          </p>
        )}
      </div>
      <nav aria-label="Lapozás" className="mt-5 flex items-center justify-between">
        <PageLink enabled={page > 1} id={id} page={page - 1} query={query}>
          ← Előző
        </PageLink>
        <span className="text-xs text-[#667085]">
          {page}. / {pageCount} oldal
        </span>
        <PageLink enabled={page < pageCount} id={id} page={page + 1} query={query}>
          Következő →
        </PageLink>
      </nav>
    </section>
  );
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        className="field"
      />
    </div>
  );
}
function PageLink({
  enabled,
  id,
  page,
  query,
  children,
}: {
  enabled: boolean;
  id: string;
  page: number;
  query: Record<string, string | string[] | undefined>;
  children: React.ReactNode;
}) {
  if (!enabled) return <span />;
  return (
    <Link
      href={{
        pathname: `/admin/kampanyok/${id}`,
        query: {
          q: first(query.q),
          city: first(query.city),
          county: first(query.county),
          participation: first(query.participation),
          page,
        },
      }}
      className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
    >
      {children}
    </Link>
  );
}
