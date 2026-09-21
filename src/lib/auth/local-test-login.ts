import 'server-only';

/** Explicitly enabled password entry for the local development app, including a hosted test backend. */
export function localTestLoginEnabled() {
  if (process.env.NODE_ENV !== 'development' || process.env.LOCAL_TEST_LOGIN !== 'true')
    return false;
  try {
    const url = new URL(process.env.SITE_URL ?? '');
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}
