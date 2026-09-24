export const maxDuration = 300;
import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TeacherMessageComposer } from '@/components/admin/TeacherMessageComposer';
export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdministratorRole('admin');
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Nincs adatbázis-kapcsolat.');
  const q = ((await searchParams).q ?? '').trim().slice(0, 100);
  let query = client
    .from('school_memberships')
    .select('user_id,display_name,email,schools!inner(name,active)')
    .eq('active', true)
    .eq('schools.active', true)
    .order('display_name')
    .limit(51);
  const safe = q.replace(/[^\p{L}\p{N}@ ._-]/gu, '').replace(/_/g, '\\_');
  if (safe) query = query.or(`display_name.ilike.%${safe}%,email.ilike.%${safe}%`);
  const { data, error } = await query;
  if (error) throw new Error('A tanárok nem tölthetők be.');
  const recipients = (data ?? []).slice(0, 50).map((m) => ({
    id: m.user_id,
    name: m.display_name,
    email: m.email,
    school: (m.schools as unknown as { name: string }).name,
  }));
  return (
    <section className="mx-auto w-full max-w-4xl min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Üzenet a tanároknak</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Válassz egy vagy több címzettet. Minden tanár külön e-mailt kap, a többiek címét nem
            látja.
          </p>
        </div>
        <Link
          href="/admin/ertesitesek"
          className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"
        >
          Küldési előzmények
        </Link>
      </div>
      <TeacherMessageComposer
        recipients={recipients}
        messageId={randomUUID()}
        truncated={(data?.length ?? 0) > 50}
      />
    </section>
  );
}
