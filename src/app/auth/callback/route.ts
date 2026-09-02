import { NextResponse, type NextRequest } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const loginUrl = new URL('/admin/login', requestUrl.origin);
  const supabase = await createServerSupabaseClient();

  if (!code || !supabase) {
    loginUrl.searchParams.set('error', 'invalid_callback');
    return NextResponse.redirect(loginUrl);
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    loginUrl.searchParams.set('error', 'invalid_callback');
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: administrator } = user
    ? await supabase
        .from('administrators')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle()
    : { data: null };

  if (!administrator) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set('error', 'not_authorized');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL('/admin', requestUrl.origin));
}
