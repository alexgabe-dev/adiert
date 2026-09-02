import { AdminFlash } from '@/components/admin/AdminFlash';
import { AdministratorInviteForm } from '@/components/admin/AdministratorInviteForm';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { manageAdministratorAction } from '@/features/admin/control-actions';
import { listAdministrators } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdministratorRole } from '@/lib/auth/roles';

interface AdministratorsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const roleLabels: Record<AdministratorRole, string> = {
  reviewer: 'Reviewer',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

export default async function AdministratorsPage({ searchParams }: AdministratorsPageProps) {
  const current = await requireAdministratorRole('super_admin');
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');
  const [administrators, parameters] = await Promise.all([
    listAdministrators(client, createPrivilegedSupabaseClient()),
    searchParams,
  ]);

  return (
    <section>
      <p className="text-xs font-extrabold tracking-[0.16em] text-blue-600 uppercase">
        Hozzáférés-kezelés
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Adminisztrátorok</h1>
      <p className="mt-2 text-sm text-[#667085]">
        Meghívások, szerepkörök és aktív hozzáférések. Minden változás auditált.
      </p>
      <AdminFlash success={first(parameters.success)} error={first(parameters.error)} />

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-[#E8ECF2] bg-white">
          <ul className="divide-y divide-slate-100">
            {administrators.map((administrator) => (
              <li key={administrator.user_id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate">
                        {administrator.display_name ?? administrator.email ?? 'Meghívott admin'}
                      </strong>
                      {administrator.user_id === current.userId ? (
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                          Te
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${administrator.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {administrator.active ? 'Aktív' : 'Inaktív'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[#667085]">
                      {administrator.email ?? `${administrator.user_id.slice(0, 8)}…`} ·{' '}
                      {roleLabels[administrator.role]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['reviewer', 'admin', 'super_admin'] as const)
                      .filter((role) => role !== administrator.role)
                      .map((role) => (
                        <ConfirmAction
                          key={role}
                          compact
                          tone={role === 'super_admin' ? 'danger' : 'primary'}
                          action={manageAdministratorAction}
                          fields={{
                            user_id: administrator.user_id,
                            role,
                            active: String(administrator.active),
                          }}
                          triggerLabel={`→ ${roleLabels[role]}`}
                          title="Admin szerepkör módosítása"
                          description={`${administrator.email ?? administrator.user_id} új szerepköre ${roleLabels[role]} lesz.${role === 'super_admin' ? ' Ez teljes hozzáférést és további adminok kezelését engedélyezi.' : ''}`}
                          confirmLabel="Szerepkör módosítása"
                        />
                      ))}
                    <ConfirmAction
                      compact
                      tone={administrator.active ? 'danger' : 'primary'}
                      action={manageAdministratorAction}
                      fields={{
                        user_id: administrator.user_id,
                        role: administrator.role,
                        active: String(!administrator.active),
                      }}
                      triggerLabel={administrator.active ? 'Deaktiválás' : 'Aktiválás'}
                      title={
                        administrator.active
                          ? 'Adminisztrátor deaktiválása'
                          : 'Adminisztrátor aktiválása'
                      }
                      description={`${administrator.email ?? administrator.user_id} ${administrator.active ? 'azonnal elveszíti a védett admin hozzáférést' : 'ismét hozzáfér az admin felülethez'}. Az utolsó aktív Super Admin védett.`}
                      confirmLabel={
                        administrator.active ? 'Hozzáférés deaktiválása' : 'Hozzáférés aktiválása'
                      }
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <aside className="h-fit rounded-2xl border border-[#E8ECF2] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Új meghívás</h2>
          <p className="mt-1 text-xs leading-5 text-[#667085]">
            A meghívás a szerveroldali Supabase Admin API-t használja. Nyilvános regisztráció nincs.
          </p>
          <div className="mt-5">
            <AdministratorInviteForm />
          </div>
        </aside>
      </div>
    </section>
  );
}
