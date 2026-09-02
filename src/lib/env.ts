import 'server-only';

import { z } from 'zod';

import { getPublicSupabaseEnvironment } from '@/lib/supabase/config';

const serverEnvironmentSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
});

const parsedEnvironment = serverEnvironmentSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsedEnvironment.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsedEnvironment.error)}`);
}

export const environment = Object.freeze(parsedEnvironment.data);

const privilegedEnvironmentSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

export function getPrivilegedSupabaseEnvironment() {
  const publicEnvironment = getPublicSupabaseEnvironment();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicEnvironment || !serviceRoleKey) {
    return null;
  }

  const parsedPrivilegedEnvironment = privilegedEnvironmentSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  });

  if (!parsedPrivilegedEnvironment.success) {
    throw new Error(
      `Invalid privileged Supabase configuration: ${z.prettifyError(parsedPrivilegedEnvironment.error)}`,
    );
  }

  return Object.freeze({
    ...publicEnvironment,
    ...parsedPrivilegedEnvironment.data,
  });
}
