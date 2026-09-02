'use client';

import { createBrowserClient } from '@supabase/ssr';

import { getPublicSupabaseEnvironment } from '@/lib/supabase/config';

export function createBrowserSupabaseClient() {
  const supabaseEnvironment = getPublicSupabaseEnvironment();

  if (!supabaseEnvironment) {
    return null;
  }

  return createBrowserClient(
    supabaseEnvironment.NEXT_PUBLIC_SUPABASE_URL,
    supabaseEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
