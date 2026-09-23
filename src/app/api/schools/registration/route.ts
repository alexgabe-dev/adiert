import { NextRequest, NextResponse } from 'next/server';
import { createPrivilegedSupabaseClient } from '@/lib/supabase/admin';
import { normalizeCity, postalCities } from '@/features/teacher/registration-location';

export async function GET(request: NextRequest) {
  const postal = request.nextUrl.searchParams.get('postal_code') ?? '';
  if (!/^\d{4}$/.test(postal))
    return NextResponse.json({ error: 'invalid_postal' }, { status: 400 });
  const cities = postalCities(postal);
  const city = request.nextUrl.searchParams.get('city') || (cities.length === 1 ? cities[0] : '');
  if (!city) return NextResponse.json({ cities, schools: [] });
  if (!cities.includes(city)) return NextResponse.json({ error: 'invalid_city' }, { status: 400 });
  try {
    const client = createPrivilegedSupabaseClient();
    if (!client) throw new Error('unavailable');
    let query = client
      .from('schools')
      .select('id,name,city')
      .eq('active', true)
      .or('type.eq.primary_school,and(type.eq.other,import_key.not.is.null)');
    query =
      normalizeCity(city) === 'budapest'
        ? query.like('search_city', 'budapest%')
        : query.eq('search_city', normalizeCity(city));
    const { data, error } = await query.order('name').limit(1000);
    if (error) throw error;
    return NextResponse.json(
      { cities, schools: data },
      { headers: { 'Cache-Control': 'public, max-age=60' } },
    );
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
