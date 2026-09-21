import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActiveAdministrator } from '@/lib/auth/authorization';
import { administratorHasRole } from '@/lib/auth/roles';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { csvCell } from '@/features/teacher/shared';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getActiveAdministrator();
  if (!admin || !administratorHasRole(admin.role, 'admin'))
    return new NextResponse(null, { status: 404 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });
  const client = await createServerSupabaseClient();
  if (!client) return new NextResponse(null, { status: 503 });
  const chunks = [
    '\uFEFFHivatkozás;Állapot;Beküldött palack;Jóváhagyott palack;Visszaváltás;Beküldve;Megjegyzés\r\n',
  ];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client
      .from('submissions')
      .select(
        'public_reference,status,submitted_bottle_count,approved_bottle_count,returned_on,created_at,teacher_note',
      )
      .eq('school_id', id)
      .order('id')
      .range(offset, offset + 499);
    if (error) return new NextResponse(null, { status: 503 });
    for (const row of data ?? [])
      chunks.push(
        [
          row.public_reference,
          row.status,
          row.submitted_bottle_count,
          row.approved_bottle_count,
          row.returned_on,
          row.created_at,
          row.teacher_note,
        ]
          .map(csvCell)
          .join(';') + '\r\n',
      );
    if ((data?.length ?? 0) < 500) break;
  }
  return new NextResponse(chunks.join(''), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="iskola-${id}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
