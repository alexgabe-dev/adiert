import 'server-only';

import { z } from 'zod';

const supabaseEnvironmentSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(20),
});

export function getSupabaseEnvironment() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url && !anonKey) {
    return null;
  }

  const parsedEnvironment = supabaseEnvironmentSchema.safeParse({
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: anonKey,
  });

  if (!parsedEnvironment.success) {
    throw new Error(
      `Invalid server Supabase configuration: ${z.prettifyError(parsedEnvironment.error)}`,
    );
  }

  return Object.freeze(parsedEnvironment.data);
}
