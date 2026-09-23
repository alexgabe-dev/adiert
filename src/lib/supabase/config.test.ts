// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { getSupabaseEnvironment } from './config';

beforeEach(() => {
  for (const name of [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]) {
    vi.stubEnv(name, undefined);
  }
});
afterEach(() => vi.unstubAllEnvs());

describe('Supabase deployment configuration', () => {
  it('supports the existing Vercel URL and public anon-key combination', () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'legacy-anon-key-for-testing');
    expect(getSupabaseEnvironment()).toEqual({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'legacy-anon-key-for-testing',
    });
  });

  it('supports both legacy public names', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'legacy-anon-key-for-testing');
    expect(getSupabaseEnvironment()?.SUPABASE_URL).toBe('https://example.supabase.co');
  });

  it('prefers explicit server-only values over legacy values', () => {
    vi.stubEnv('SUPABASE_URL', 'https://private.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'server-anon-key-for-testing');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://legacy.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'legacy-anon-key-for-testing');
    expect(getSupabaseEnvironment()).toEqual({
      SUPABASE_URL: 'https://private.supabase.co',
      SUPABASE_ANON_KEY: 'server-anon-key-for-testing',
    });
  });

  it('returns null when Supabase is not configured', () => {
    expect(getSupabaseEnvironment()).toBeNull();
  });

  it('still rejects incomplete configuration', () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    expect(getSupabaseEnvironment).toThrow('SUPABASE_ANON_KEY');
  });

  it('does not silently replace an invalid explicit private value', () => {
    vi.stubEnv('SUPABASE_URL', 'invalid');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'server-anon-key-for-testing');
    expect(getSupabaseEnvironment).toThrow('SUPABASE_URL');
  });
});
