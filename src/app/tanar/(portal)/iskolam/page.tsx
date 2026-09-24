import { requireTeacher, type Membership, type SchoolInvitation } from '@/features/teacher/server';
import { TeamPanel } from '@/components/teacher/TeamPanel';
export default async function MySchool() {
  const { client, membership, school } = await requireTeacher();
  const [members, invitations] = await Promise.all([
    client.from('school_memberships').select('*').eq('school_id', school.id),
    membership.role === 'owner'
      ? client
          .from('school_invitations')
          .select('*')
          .eq('school_id', school.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (members.error || invitations.error) throw new Error('A csapat nem tölthető be.');
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Iskolám és a csapat</h1>
      <div className="my-6 rounded-3xl bg-blue-600 p-6 text-white">
        <h2 className="text-xl font-bold">{school.name}</h2>
        <p className="mt-2 text-sm text-blue-100">
          {school.postal_code} {school.city}
        </p>
        <p className="mt-5 text-xs text-blue-100">
          Hivatalos adat módosításához írj a szervezőknek: info@palackverseny.hu
        </p>
      </div>
      <TeamPanel
        schoolId={school.id}
        members={(members.data ?? []) as Membership[]}
        invitations={(invitations.data ?? []) as SchoolInvitation[]}
        canManage={membership.role === 'owner'}
      />
    </div>
  );
}
