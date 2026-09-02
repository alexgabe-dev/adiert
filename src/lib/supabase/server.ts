import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getSupabaseEnvironment } from '@/lib/supabase/config';

export async function createServerSupabaseClient() {
  const supabaseEnvironment = getSupabaseEnvironment();

  if (!supabaseEnvironment) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseEnvironment.SUPABASE_URL,
    supabaseEnvironment.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies. The proxy refreshes the session instead.
          }
        },
      },
    },
  );
}
