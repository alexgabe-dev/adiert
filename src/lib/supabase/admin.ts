import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { getPrivilegedSupabaseEnvironment } from '@/lib/env';

export function createPrivilegedSupabaseClient() {
  const supabaseEnvironment = getPrivilegedSupabaseEnvironment();

  if (!supabaseEnvironment) {
    return null;
  }

  return createClient(
    supabaseEnvironment.SUPABASE_URL,
    supabaseEnvironment.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
