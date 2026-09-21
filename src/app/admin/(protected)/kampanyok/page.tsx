import Link from 'next/link';

import { AdminFlash } from '@/components/admin/AdminFlash';
import { saveCampaignAction } from '@/features/admin/control-actions';
import { listCampaigns } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function CampaignsPage({ searchParams }: Props) {
  await requireAdministratorRole('admin');
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');
  const [campaigns, params] = await Promise.all([listCampaigns(client), searchParams]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section>
      <p className="text-xs font-extrabold tracking-[0.16em] text-blue-600 uppercase">
        Kampánykezelés
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Kampányok</h1>
      <p className="mt-2 text-sm text-[#667085]">
        Tervezés, részvétel és biztonságos aktiválás egy helyen.
      </p>
      <AdminFlash success={first(params.success)} error={first(params.error)} />
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          {campaigns.length ? (
            campaigns.map((campaign) => {
              const state = campaign.active
                ? 'Aktív'
                : campaign.end_date < today
                  ? 'Lezárt'
                  : 'Tervezett';
              return (
                <Link
                  key={campaign.id}
                  href={`/admin/kampanyok/${campaign.id}`}
                  className="block rounded-2xl border border-[#E8ECF2] bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/20"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-extrabold">{campaign.name}</h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${campaign.active ? 'bg-emerald-50 text-emerald-700' : state === 'Lezárt' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}
                        >
                          {state}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#667085]">
                        {campaign.start_date} – {campaign.end_date}
                      </p>
                    </div>
                    <div className="text-sm sm:text-right">
                      <strong>{campaign.target_amount.toLocaleString('hu-HU')} Ft</strong>
                      <p className="mt-1 text-xs text-[#667085]">
                        {campaign.participatingSchoolCount.toLocaleString('hu-HU')} iskola
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-[#667085]">
              Még nincs kampány. Hozd létre az elsőt a jobb oldali űrlapon.
            </div>
          )}
        </div>
        <div className="h-fit rounded-2xl border border-[#E8ECF2] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Új kampány</h2>
          <p className="mt-1 text-xs text-[#667085]">
            Az új kampány tervezett, inaktív állapotban jön létre.
          </p>
          <form action={saveCampaignAction} className="mt-5 space-y-4">
            <input type="hidden" name="campaign_id" value="" />
            <Field label="Név" name="name" required />
            <Field label="Slug" name="slug" placeholder="adiert-2026" required />
            <div>
              <label className="mb-1.5 block text-sm font-bold" htmlFor="campaign-description">
                Leírás
              </label>
              <textarea
                id="campaign-description"
                name="description"
                rows={3}
                maxLength={5000}
                className="field"
              />
            </div>
            <Field label="Célösszeg (Ft)" name="target_amount" type="number" min="1" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kezdés" name="start_date" type="date" required />
              <Field label="Zárás" name="end_date" type="date" required />
            </div>
            <button
              type="submit"
              className="min-h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white hover:bg-blue-700"
            >
              Kampány létrehozása
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = 'text',
  ...props
}: {
  label: string;
  name: string;
  type?: string;
  [key: string]: string | boolean | undefined;
}) {
  const id = `new-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      <input id={id} name={name} type={type} className="field" {...props} />
    </div>
  );
}
