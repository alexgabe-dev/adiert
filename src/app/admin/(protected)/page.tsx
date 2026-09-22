import type { ReactNode } from 'react';
import Link from 'next/link';
import { Banknote, Clock3, Recycle, School } from 'lucide-react';

import { listRecentReviews } from '@/features/admin/control-center';
import { listAdminSubmissions } from '@/features/admin/submissions';
import { queryCampaignSummary, queryLeaderboard } from '@/features/public-data/repository';
import { requireActiveAdministrator } from '@/lib/auth/authorization';
import { administratorHasRole } from '@/lib/auth/roles';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const formatHuf = (value: number) => `${value.toLocaleString('hu-HU')} Ft`;

export default async function AdminPage() {
  const administrator = await requireActiveAdministrator();
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');
  const [campaign, pending, pendingCountResult, schoolCountResult, recentReviews] =
    await Promise.all([
      queryCampaignSummary(client),
      listAdminSubmissions(client, { status: 'pending', schoolSearch: '', page: 1, pageSize: 5 }),
      client
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      client.from('schools').select('id', { count: 'exact', head: true }).eq('active', true),
      listRecentReviews(client, 5),
    ]);
  const leaderboard = campaign
    ? await queryLeaderboard(client, campaign.id, { page: 1, pageSize: 5 })
    : { schools: [], totalCount: 0, page: 1, pageSize: 5 };
  const privileged = createPrivilegedSupabaseClient();
  const bucketOk = privileged
    ? !(await privileged.storage.getBucket('receipt-images')).error
    : false;
  const canOperate = administratorHasRole(administrator.role, 'admin');
  const { count: applicationCount, error: applicationError } = canOperate
    ? await client
        .from('school_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
    : { count: 0, error: null };
  if (applicationError) throw new Error('A jelentkezések nem tölthetők be.');
  const kpis = [
    {
      label: 'Jóváhagyott összeg',
      value: formatHuf(campaign?.approvedAmount ?? 0),
      icon: Banknote,
    },
    {
      label: 'Jóváhagyott palackok',
      value: (campaign?.approvedBottleCount ?? 0).toLocaleString('hu-HU'),
      icon: Recycle,
    },
    {
      label: 'Résztvevő / aktív iskola',
      value: `${(campaign?.participatingSchoolCount ?? 0).toLocaleString('hu-HU')} / ${(schoolCountResult.count ?? 0).toLocaleString('hu-HU')}`,
      icon: School,
    },
    {
      label: 'Ellenőrzésre vár',
      value: (pendingCountResult.count ?? 0).toLocaleString('hu-HU'),
      icon: Clock3,
    },
  ];

  return (
    <section>
      <p className="text-xs font-extrabold tracking-[0.16em] text-blue-600 uppercase">Áttekintés</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
        Jó napot, {administrator.displayName ?? 'Admin'}!
      </h1>
      <p className="mt-2 text-sm text-[#667085]">
        A legfontosabb kampány- és ellenőrzési állapot egy helyen.
      </p>
      {canOperate && (applicationCount ?? 0) > 0 && (
        <Link
          href="/admin/jelentkezesek"
          className="mt-6 block rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm font-bold text-blue-800"
        >
          {applicationCount ?? 0} iskolai jelentkezés vár jóváhagyásra →
        </Link>
      )}
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[#E8ECF2] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#667085]">{label}</p>
              <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#E8ECF2] bg-white">
          <div className="flex items-center justify-between border-b border-[#E8ECF2] px-5 py-4">
            <div>
              <h2 className="font-extrabold">Ellenőrzésre vár</h2>
              <p className="mt-0.5 text-xs text-[#667085]">A legutóbbi függőben lévő beküldések</p>
            </div>
            <Link href="/admin/bekuldesek" className="text-sm font-bold text-blue-600">
              Összes beküldés
            </Link>
          </div>
          {pending.items.length ? (
            <ul className="divide-y divide-slate-100">
              {pending.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/bekuldesek/${item.id}`}
                    className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.schoolName}</p>
                      <p className="truncate text-xs text-[#667085]">{item.campaignName}</p>
                    </div>
                    <time className="shrink-0 text-xs text-[#667085]" dateTime={item.createdAt}>
                      {new Intl.DateTimeFormat('hu-HU', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(item.createdAt))}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-8 text-center text-sm text-[#667085]">
              Nincs ellenőrzésre váró beküldés.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-extrabold">Kampány állapota</h2>
              <p className="mt-0.5 text-xs text-[#667085]">
                {campaign ? 'Aktív' : 'Nincs aktív kampány'}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${campaign ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
            >
              {campaign ? 'Aktív' : 'Beállítás szükséges'}
            </span>
          </div>
          {campaign ? (
            <>
              <p className="mt-5 font-extrabold">{campaign.name}</p>
              <p className="mt-1 text-xs text-[#667085]">
                {campaign.startDate} – {campaign.endDate}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${Math.min(100, Math.round((campaign.approvedAmount / campaign.targetAmount) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span>{formatHuf(campaign.approvedAmount)}</span>
                <span className="text-[#667085]">{formatHuf(campaign.targetAmount)}</span>
              </div>
              <p className="mt-4 text-sm">
                <strong>{campaign.participatingSchoolCount.toLocaleString('hu-HU')}</strong>{' '}
                résztvevő iskola
              </p>
            </>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[#667085]">
              Hozd létre az első kampányt, majd add hozzá a résztvevő iskolákat.
            </p>
          )}
          {canOperate ? (
            <Link
              href={campaign ? `/admin/kampanyok/${campaign.id}` : '/admin/kampanyok'}
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
            >
              {campaign ? 'Kampány kezelése' : 'Kampány létrehozása'}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5">
          <h2 className="font-extrabold">Top iskolák</h2>
          {leaderboard.schools.length ? (
            <ol className="mt-4 space-y-3">
              {leaderboard.schools.map((school) => (
                <li key={school.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold">
                    {school.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{school.name}</p>
                    <p className="text-xs text-[#667085]">{school.city}</p>
                  </div>
                  <strong className="text-sm">{formatHuf(school.approvedAmount)}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-[#667085]">Még nincs jóváhagyott iskolai eredmény.</p>
          )}
        </div>
        <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5">
          <h2 className="font-extrabold">Rendszer állapota</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <Status ok>Adatbázis csatlakoztatva</Status>
            <Status ok={(schoolCountResult.count ?? 0) > 0}>
              {(schoolCountResult.count ?? 0).toLocaleString('hu-HU')} iskola betöltve
            </Status>
            <Status ok={bucketOk}>Privát bizonylattárhely</Status>
            <Status ok={Boolean(campaign)}>Aktív kampány</Status>
            <Status ok={(campaign?.participatingSchoolCount ?? 0) > 0}>Résztvevő iskolák</Status>
            <Status ok>Adminisztráció működik</Status>
          </ul>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-[#E8ECF2] bg-white">
        <div className="border-b border-[#E8ECF2] px-5 py-4">
          <h2 className="font-extrabold">Legutóbbi felülvizsgálatok</h2>
          <p className="mt-0.5 text-xs text-[#667085]">A beküldések legutóbbi ellenőrzései</p>
        </div>
        {recentReviews.length ? (
          <ol className="divide-y divide-slate-100">
            {recentReviews.map((review) => (
              <li
                key={review.id}
                className="flex min-h-16 flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/admin/bekuldesek/${review.submission_id}`}
                    className="text-sm font-bold text-blue-700"
                  >
                    {review.from_status} → {review.to_status}
                  </Link>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">
                    ellenőr {review.reviewer_id.slice(0, 8)}…
                  </p>
                </div>
                <time className="text-xs text-[#667085]" dateTime={review.created_at}>
                  {new Intl.DateTimeFormat('hu-HU', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(review.created_at))}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="p-8 text-center text-sm text-[#667085]">
            Még nincs felülvizsgálati esemény.
          </p>
        )}
      </div>
    </section>
  );
}

function Status({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
      >
        {ok ? '✓' : '!'}
      </span>
      <span>{children}</span>
    </li>
  );
}
