import { z } from 'zod';

const publicSupabaseEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

export function getPublicSupabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url && !anonKey) {
    return null;
  }

  const parsedEnvironment = publicSupabaseEnvironmentSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  });

  if (!parsedEnvironment.success) {
    throw new Error(
      `Invalid public Supabase configuration: ${z.prettifyError(parsedEnvironment.error)}`,
    );
  }

  return Object.freeze(parsedEnvironment.data);
}
