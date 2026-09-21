import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { dispatchNotifications } from '@/features/teacher/notifications';
export async function GET(request: NextRequest) {
  const expected = process.env.NOTIFICATION_CRON_SECRET;
  const actual = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (
    !expected ||
    !actual ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await dispatchNotifications(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
