import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { teacherEntryStatus } from '@/features/teacher/server';
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const teacher = url.searchParams.get('next')?.startsWith('/tanar');
  const login = new URL(teacher ? '/tanar/belepes' : '/admin/login', url.origin);
  const client = await createServerSupabaseClient();
  if (!code || !client || (await client.auth.exchangeCodeForSession(code)).error) {
    login.searchParams.set('error', 'invalid_callback');
    return NextResponse.redirect(login);
  }
  if (teacher && url.searchParams.get('next') !== '/tanar/jelszo') {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return NextResponse.redirect(login);
    const status = await teacherEntryStatus(client, user);
    if (['pending', 'rejected', 'paused'].includes(status)) {
      await client.auth.signOut();
      login.searchParams.set('status', status);
      return NextResponse.redirect(login);
    }
  }
  if (teacher)
    return NextResponse.redirect(
      new URL(
        url.searchParams.get('next') === '/tanar/jelszo' ? '/tanar/jelszo' : '/tanar',
        url.origin,
      ),
    );
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: admin } = user
    ? await client
        .from('administrators')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle()
    : { data: null };
  if (!admin) {
    login.searchParams.set('error', 'not_authorized');
    return NextResponse.redirect(login);
  }
  return NextResponse.redirect(new URL('/admin', url.origin));
}
