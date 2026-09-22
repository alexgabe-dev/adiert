import 'server-only';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface Membership {
  user_id: string;
  school_id: string;
  role: 'owner' | 'teacher';
  display_name: string;
  email: string;
  active: boolean;
}
export interface SchoolApplication {
  id: string;
  user_id: string;
  school_id: string | null;
  school_name: string;
  city: string;
  postal_code: string;
  contact_name: string;
  email: string;
  status: string;
  reason: string | null;
  version: number;
  created_at: string;
}
export interface TeacherSubmission {
  id: string;
  public_reference: string;
  school_id: string;
  status: string;
  submitted_bottle_count: number | null;
  approved_bottle_count: number | null;
  returned_on: string | null;
  teacher_note: string | null;
  feedback: string | null;
  version: number;
  created_at: string;
  submitted_by: string | null;
}
export interface SchoolInvitation {
  id: string;
  school_id: string;
  email: string;
  status: string;
  expires_at: string;
}

export async function teacherSession() {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return null;
  const { data, error: memberError } = await client
    .from('school_memberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (memberError) throw new Error('Az iskolai jogosultságok nem tölthetők be.');
  return { client, user, membership: data as Membership | null };
}
export async function requireTeacherAccount() {
  const session = await teacherSession();
  if (!session) redirect('/tanar/belepes');
  return session;
}
export async function requireTeacher() {
  const session = await requireTeacherAccount();
  if (!session.membership) {
    const { data: invitations, error: invitationError } = await session.client
      .from('school_invitations')
      .select('id')
      .eq('email', session.user.email?.toLowerCase() ?? '')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .limit(1);
    if (invitationError) throw new Error('A meghívások nem tölthetők be.');
    if (invitations?.length) redirect('/tanar/meghivasok');
    redirect('/tanar/jelentkezes');
  }
  const { data: school, error } = await session.client
    .from('schools')
    .select('id,name,city,postal_code,active')
    .eq('id', session.membership.school_id)
    .maybeSingle();
  if (error) throw new Error('Az iskola nem tölthető be.');
  if (!school || !school.active) redirect('/tanar/jelentkezes?paused=1');
  return {
    ...session,
    membership: session.membership,
    school: school as {
      id: string;
      name: string;
      city: string;
      postal_code: string | null;
      active: boolean;
    },
  };
}
export async function teacherSubmissions(schoolId: string, page = 1, status?: string) {
  const { client } = await requireTeacher();
  let query = client
    .from('submissions')
    .select(
      'id,public_reference,school_id,status,submitted_bottle_count,approved_bottle_count,returned_on,teacher_note,feedback,version,created_at,submitted_by',
      { count: 'exact' },
    )
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (status && ['pending', 'needs_review', 'approved', 'rejected'].includes(status))
    query = query.eq('status', status);
  const { data, error, count } = await query.range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error('A beküldések nem tölthetők be.');
  return { items: (data ?? []) as TeacherSubmission[], total: count ?? 0 };
}
