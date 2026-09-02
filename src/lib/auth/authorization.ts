import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';

import { administratorHasRole, administratorRoles, type AdministratorRole } from '@/lib/auth/roles';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const administratorSchema = z.object({
  user_id: z.uuid(),
  role: z.enum(administratorRoles),
  active: z.literal(true),
  display_name: z.string().nullable(),
});

export interface ActiveAdministrator {
  userId: string;
  email: string | null;
  role: AdministratorRole;
  displayName: string | null;
}

export async function getActiveAdministrator(): Promise<ActiveAdministrator | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from('administrators')
    .select('user_id, role, active, display_name')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const parsedAdministrator = administratorSchema.safeParse(data);
  if (!parsedAdministrator.success) {
    return null;
  }

  return {
    userId: parsedAdministrator.data.user_id,
    email: user.email ?? null,
    role: parsedAdministrator.data.role,
    displayName: parsedAdministrator.data.display_name,
  };
}

export async function requireActiveAdministrator() {
  const administrator = await getActiveAdministrator();

  if (!administrator) {
    redirect('/admin/login');
  }

  return administrator;
}

export async function requireAdministratorRole(requiredRole: AdministratorRole) {
  const administrator = await requireActiveAdministrator();

  if (!administratorHasRole(administrator.role, requiredRole)) {
    notFound();
  }

  return administrator;
}
