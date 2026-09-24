// @vitest-environment node
// Explicit opt-in: creates an isolated school, uses Resend's test recipient, then archives it.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
const context = vi.hoisted(() => ({
  privileged: null as SupabaseClient | null,
  current: null as SupabaseClient | null,
  userId: '',
}));
vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
  notFound: () => {
    throw new Error('not found');
  },
}));
vi.mock('@/lib/security/origin', () => ({ hasValidMutationOrigin: async () => true }));
vi.mock('./auth-rate-limit', () => ({ allowTeacherAuth: async () => true }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => context.current,
}));
vi.mock('@/lib/supabase/admin', () => ({
  createPrivilegedSupabaseClient: () => {
    const client = context.privileged!;
    return new Proxy(client, {
      get(target, property) {
        if (property === 'rpc')
          return async (name: string, args: object) => {
            if (name === 'claim_email_batch') {
              const result = await client
                .from('email_outbox')
                .select('*')
                .eq('target_user_id', context.userId)
                .eq('status', 'pending');
              if (
                result.data?.some(
                  (m) =>
                    !m.recipient.startsWith('delivered+approval-') ||
                    !m.recipient.endsWith('@resend.dev'),
                )
              )
                throw new Error('Unsafe test recipient');
              return result;
            }
            return client.rpc(name, args);
          };
        const value = Reflect.get(target, property);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  },
}));
import { teacherAuthAction } from './actions';
import { decideApplication, sendTeacherMessage } from '@/features/admin/portal-actions';
import { dispatchNotifications } from './notifications';
import { activateTeacher } from '@/app/tanar/megerosites/actions';
const enabled = process.env.TEST_REMOTE_APPROVAL === 'true';
if (enabled) process.loadEnvFile('.env.local');
const initial = { status: 'idle' as const, message: '' };
const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};
describe.skipIf(!enabled)('hosted approval journey (explicit opt-in)', () => {
  it('receives, approves, confirms once, logs in, and sends a teacher message', async () => {
    const transport = createRequire(import.meta.url)('ws') as typeof WebSocket;
    const url = process.env.SUPABASE_URL!,
      key = process.env.SUPABASE_ANON_KEY!;
    const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
      realtime: { transport },
    });
    context.privileged = service;
    const teacher = createClient(url, key, {
      auth: { persistSession: false },
      realtime: { transport },
    });
    const reviewer = createClient(url, key, {
      auth: { persistSession: false },
      realtime: { transport },
    });
    context.current = teacher;
    const schoolId = randomUUID(),
      email = `delivered+approval-${Date.now()}@resend.dev`,
      password = `Aa!${randomUUID()}`;
    const inserted = await service
      .from('schools')
      .insert({
        id: schoolId,
        name: 'Automatikus folyamatpróba (archiválandó)',
        slug: `approval-test-${schoolId}`,
        type: 'primary_school',
        city: 'Budapest',
        county: 'Budapest',
        postal_code: '1111',
      });
    expect(inserted.error).toBeNull();
    try {
      const signup = await teacherAuthAction(
        initial,
        form({
          mode: 'signup',
          email,
          password,
          school_id: schoolId,
          postal_code: '1111',
          city: 'Budapest',
          contact_name: 'Automatikus teszt',
        }),
      );
      expect(signup.status).toBe('success');
      const app = await service.from('school_applications').select('*').eq('email', email).single();
      expect(app.error).toBeNull();
      context.userId = app.data.user_id;
      expect(app.data.status).toBe('pending');
      expect(
        (await service.auth.admin.getUserById(context.userId)).data.user?.email_confirmed_at,
      ).toBeFalsy();
      expect((await teacher.auth.signInWithPassword({ email, password })).error).not.toBeNull();
      expect((await dispatchNotifications()).sent).toBe(1);
      const receipt = await service
        .from('email_outbox')
        .select('kind,status')
        .eq('target_user_id', context.userId);
      expect(receipt.data).toEqual([{ kind: 'registration_received', status: 'sent' }]);
      expect(
        (
          await reviewer.auth.signInWithPassword({
            email: 'admin@adiert.test',
            password: 'AdiAdmin2026!',
          })
        ).error,
      ).toBeNull();
      context.current = reviewer;
      const decision = await decideApplication(
        initial,
        form({ id: app.data.id, version: '1', status: 'approved', reason: '', school: schoolId }),
      );
      expect(decision.status).toBe('success');
      expect(
        (await service.auth.admin.getUserById(context.userId)).data.user?.email_confirmed_at,
      ).toBeFalsy();
      expect((await teacher.auth.signInWithPassword({ email, password })).error).not.toBeNull();
      expect((await dispatchNotifications()).sent).toBe(1);
      const outbox = await service
        .from('email_outbox')
        .select('id')
        .eq('target_user_id', context.userId)
        .eq('kind', 'activation')
        .single();
      const { createHmac } = await import('node:crypto');
      const token = createHmac('sha256', process.env.SUBMISSION_RATE_LIMIT_SECRET!)
        .update(`activation:${outbox.data!.id}`)
        .digest('hex');
      context.current = teacher;
      await expect(activateTeacher(initial, form({ token }))).rejects.toThrow('REDIRECT:/tanar');
      expect((await teacher.auth.getUser()).data.user?.email_confirmed_at).toBeTruthy();
      expect((await activateTeacher(initial, form({ token }))).status).toBe('error');
      await teacher.auth.signOut();
      expect((await teacher.auth.signInWithPassword({ email, password })).error).toBeNull();
      context.current = reviewer;
      const message = form({
        message_id: randomUUID(),
        users: context.userId,
        subject: 'Folyamatpróba',
        body: 'Ez egy automatikus levélküldési próba a Resend tesztcímére.',
      });
      expect((await sendTeacherMessage(initial, message)).status).toBe('success');
      expect((await sendTeacherMessage(initial, message)).status).toBe('success');
      expect((await dispatchNotifications()).sent).toBe(1);
      expect(
        (
          await service
            .from('email_outbox')
            .select('id')
            .eq('target_user_id', context.userId)
            .eq('kind', 'admin_message')
        ).data,
      ).toHaveLength(1);
    } finally {
      if (context.userId) {
        for (const table of ['email_outbox', 'school_applications', 'school_memberships']) {
          const result = await service
            .from(table)
            .delete()
            .eq(table === 'email_outbox' ? 'target_user_id' : 'user_id', context.userId);
          expect(result.error).toBeNull();
        }
        expect((await service.auth.admin.deleteUser(context.userId)).error).toBeNull();
      }
      await service.from('campaign_schools').delete().eq('school_id', schoolId);
      await service.from('schools').update({ active: false }).eq('id', schoolId);
      await reviewer.auth.signOut();
      await teacher.auth.signOut();
    }
  }, 60000);
});
