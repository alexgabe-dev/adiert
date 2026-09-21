import Link from 'next/link';
import { requireTeacherAccount, type SchoolInvitation } from '@/features/teacher/server';
import { ActionForm, Field } from '@/components/teacher/ActionForm';
import { teamAction } from '@/features/teacher/actions';
export default async function InvitationsPage() {
  const { client, user } = await requireTeacherAccount();
  const { data, error } = await client
    .from('school_invitations')
    .select('*')
    .eq('email', user.email?.toLowerCase() ?? '')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());
  if (error) throw new Error('A meghívások nem tölthetők be.');
  return (
    <main className="min-h-screen bg-[#F5F8FD] px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Link href="/tanar" className="font-bold text-blue-600">
          ← Iskolai felület
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold">Meghívásaim</h1>
        <p className="mt-3 text-sm text-slate-600">A(z) {user.email} címre érkezett meghívók.</p>
        <div className="mt-6 space-y-4">
          {!(data ?? []).length && (
            <p className="rounded-2xl bg-white p-6">
              Nincs érvényes meghívás. Ellenőrizd, hogy a meghívott e-mail-címmel léptél-e be.
            </p>
          )}
          {await Promise.all(
            ((data ?? []) as SchoolInvitation[]).map(async (inv) => {
              const { data: school } = await client.rpc('invited_school_name', {
                p_invitation: inv.id,
              });
              return (
                <div key={inv.id} className="rounded-2xl bg-white p-6">
                  <h2 className="mb-4 text-xl font-bold">{school ?? 'Iskolai csapat'}</h2>
                  <ActionForm action={teamAction} label="Csatlakozom a csapathoz">
                    <input type="hidden" name="intent" value="accept" />
                    <input type="hidden" name="id" value={inv.id} />
                    <Field label="Teljes neved" name="name" minLength={2} maxLength={120} />
                  </ActionForm>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </main>
  );
}
