import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getPublicSupabaseEnvironment } from '@/lib/supabase/config';

export async function createServerSupabaseClient() {
  const supabaseEnvironment = getPublicSupabaseEnvironment();

  if (!supabaseEnvironment) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseEnvironment.NEXT_PUBLIC_SUPABASE_URL,
    supabaseEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
