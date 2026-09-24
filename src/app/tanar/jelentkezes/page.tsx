import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireTeacherAccount, type SchoolApplication } from '@/features/teacher/server';
import { ApplicationForm } from '@/components/teacher/ApplicationForm';
import { teacherSignOut } from '@/features/teacher/actions';
export default async function ApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ paused?: string }>;
}) {
  const { client, user, membership } = await requireTeacherAccount();
  const p = await searchParams;
  if (membership && !p.paused) redirect('/tanar');
  const { data, error } = await client
    .from('school_applications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw new Error('A jelentkezés nem tölthető be.');
  const a = data as SchoolApplication | null;
  return (
    <main className="min-h-screen bg-[#F5F8FD] px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-xl font-extrabold">
          Ádiért.
        </Link>
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            Iskolai csatlakozás
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">
            {p.paused
              ? 'A hozzáférés szünetel.'
              : a?.status === 'pending'
                ? 'Megérkezett a jelentkezésed.'
                : 'Iskola regisztrálása'}
          </h1>
          <p className="mt-3 mb-6 text-sm text-slate-600">{user.email}</p>
          {p.paused ? (
            <p className="rounded-xl bg-amber-50 p-4">
              Az iskolád jelenleg inaktív. Egyeztess a szervezőkkel az info@palackverseny.hu címen.
            </p>
          ) : a?.status === 'pending' ? (
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="font-bold">{a.school_name}</p>
              <p className="mt-2 text-sm leading-relaxed">
                A szervezők ellenőrzik az adatokat. A döntésről e-mailt kapsz; addig gyűjthetitek a
                palackokat.
              </p>
            </div>
          ) : a?.status === 'rejected' ? (
            <p className="rounded-xl bg-rose-50 p-4 text-rose-900">
              A jelentkezést elutasítottuk. {a.reason} Kérdés esetén: info@palackverseny.hu.
            </p>
          ) : a?.status === 'approved' ? (
            <p className="rounded-xl bg-amber-50 p-4">
              A korábbi hozzáférésed már nem aktív. Új meghívást kérhetsz az iskolád adminjától.
            </p>
          ) : (
            <>
              {a?.reason && (
                <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm">
                  Pontosítást kérünk: {a.reason}
                </p>
              )}
              <ApplicationForm application={a} />
            </>
          )}
          <Link
            href="/tanar/meghivasok"
            className="mt-6 flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Meghívott egy kolléga? Meghívásaim →
          </Link>
          <form action={teacherSignOut}>
            <button className="min-h-11 text-sm text-slate-600">Kilépés</button>
          </form>
        </div>
      </div>
    </main>
  );
}
