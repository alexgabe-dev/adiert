import { ActionForm, Field } from '@/components/teacher/ActionForm';
import { updateContact } from '@/features/admin/portal-actions';
import { teamAction } from '@/features/teacher/actions';
import type { Membership, SchoolInvitation } from '@/features/teacher/server';
export function TeamPanel({
  schoolId,
  members,
  invitations,
  canManage,
  isAdmin = false,
}: {
  schoolId: string;
  members: Membership[];
  invitations: SchoolInvitation[];
  canManage: boolean;
  isAdmin?: boolean;
}) {
  const activeInvites = invitations.filter(
    (i) => i.status === 'pending' && new Date(i.expires_at) > new Date(),
  );
  const count =
    members.filter((m) => m.active && m.role === 'teacher').length + activeInvites.length;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Az iskola csapata</h2>
        <p className="mt-2 text-sm text-slate-500">
          1 iskolai admin + legfeljebb 10 tanár · {count}/10 tanári hely foglalt, a függő
          meghívókkal együtt.
        </p>
      </div>
      <div className="space-y-3">
        {members
          .filter((m) => m.active)
          .map((m) => (
            <div key={m.user_id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-bold">{m.display_name}</p>
              <p className="mt-1 break-all text-sm text-slate-500">{m.email}</p>
              <p className="mt-2 text-xs font-bold text-blue-600">
                {m.role === 'owner' ? 'Iskolai admin · Fő kapcsolattartó' : 'Tanár'}
              </p>
              {isAdmin && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-bold text-blue-600">
                    Kapcsolattartó szerkesztése
                  </summary>
                  <ActionForm action={updateContact} label="Név mentése" className="mt-4 space-y-3">
                    <input type="hidden" name="user" value={m.user_id} />
                    <Field
                      label="Teljes név"
                      name="name"
                      value={m.display_name}
                      minLength={2}
                      maxLength={120}
                    />
                  </ActionForm>
                </details>
              )}
              {canManage && (m.role === 'teacher' || isAdmin) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionForm
                    action={teamAction}
                    label="Hozzáférés visszavonása"
                    tone="danger"
                    confirm={`${m.display_name} hozzáférését visszavonod?`}
                  >
                    <input type="hidden" name="intent" value="remove" />
                    <input type="hidden" name="id" value={schoolId} />
                    <input type="hidden" name="target" value={m.user_id} />
                  </ActionForm>
                  {isAdmin && m.role === 'teacher' && (
                    <ActionForm
                      action={teamAction}
                      label="Legyen iskolai admin"
                      tone="secondary"
                      confirm={`Átadod az iskolai adminszerepet neki: ${m.display_name}? A korábbi admin tanári hozzáféréssel marad.`}
                    >
                      <input type="hidden" name="intent" value="transfer_owner" />
                      <input type="hidden" name="id" value={schoolId} />
                      <input type="hidden" name="target" value={m.user_id} />
                    </ActionForm>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
      {canManage && (
        <>
          <div className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="mb-4 font-bold">Hívj meg egy kollégát</h3>
            <p className="mb-4 text-sm leading-6 text-slate-600">
              A kollégád a saját e-mail-címével regisztrál, majd a Meghívásaim oldalon csatlakozik.
              Nem kell újra regisztrálnia az iskolát.
            </p>
            {count < 10 ? (
              <ActionForm action={teamAction} label="Meghívó küldése">
                <input type="hidden" name="intent" value="invite" />
                <input type="hidden" name="id" value={schoolId} />
                <Field label="Kolléga e-mail-címe" name="email" type="email" />
              </ActionForm>
            ) : (
              <p className="text-sm text-amber-800">
                Minden tanári hely foglalt. Egy hozzáférés vagy meghívás visszavonásával
                szabadíthatsz fel helyet.
              </p>
            )}
          </div>
          {activeInvites.map((i) => (
            <div key={i.id} className="rounded-2xl border border-dashed border-slate-300 p-5">
              <p className="break-all text-sm font-bold">{i.email}</p>
              <p className="mt-1 mb-3 text-xs text-slate-500">
                Meghívás elfogadásra vár · lejár: {i.expires_at.slice(0, 10)}
              </p>
              <ActionForm
                action={teamAction}
                label="Meghívás visszavonása"
                tone="danger"
                confirm="Visszavonod ezt a meghívást?"
              >
                <input type="hidden" name="intent" value="revoke_invite" />
                <input type="hidden" name="id" value={schoolId} />
                <input type="hidden" name="target" value={i.id} />
              </ActionForm>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
