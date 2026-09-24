import { NextRequest, NextResponse } from 'next/server';
import { getActiveAdministrator } from '@/lib/auth/authorization';
import { administratorHasRole } from '@/lib/auth/roles';
import { createServerSupabaseClient } from '@/lib/supabase/server';
export async function GET(request: NextRequest) {
  const admin = await getActiveAdministrator();
  if (!admin || !administratorHasRole(admin.role, 'admin'))
    return NextResponse.json({}, { status: 403 });
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({}, { status: 503 });
  const q = (request.nextUrl.searchParams.get('q') ?? '')
    .slice(0, 100)
    .replace(/[^\p{L}\p{N}@ .-]/gu, '');
  let query = client
    .from('school_memberships')
    .select('user_id,display_name,email,schools!inner(name,active)')
    .eq('active', true)
    .eq('schools.active', true)
    .order('display_name')
    .limit(51);
  if (q) query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({}, { status: 503 });
  return NextResponse.json(
    {
      recipients: (data ?? [])
        .slice(0, 50)
        .map((m) => ({
          id: m.user_id,
          name: m.display_name,
          email: m.email,
          school: (m.schools as unknown as { name: string }).name,
        })),
      truncated: (data?.length ?? 0) > 50,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
