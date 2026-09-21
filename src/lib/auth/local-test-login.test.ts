import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { localTestLoginEnabled } from './local-test-login';

afterEach(() => vi.unstubAllEnvs());
describe('local password login gate', () => {
  it('allows an opted-in local app with a hosted Supabase backend', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LOCAL_TEST_LOGIN', 'true');
    vi.stubEnv('SITE_URL', 'http://localhost:3010');
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    expect(localTestLoginEnabled()).toBe(true);
  });
  it.each([
    ['production', 'true', 'http://localhost:3010'],
    ['development', 'false', 'http://localhost:3010'],
    ['development', 'true', 'https://palackverseny.hu'],
    ['development', 'true', 'invalid'],
  ])('blocks %s / %s / %s', (nodeEnv, optIn, siteUrl) => {
    vi.stubEnv('NODE_ENV', nodeEnv);
    vi.stubEnv('LOCAL_TEST_LOGIN', optIn);
    vi.stubEnv('SITE_URL', siteUrl);
    expect(localTestLoginEnabled()).toBe(false);
  });
});
