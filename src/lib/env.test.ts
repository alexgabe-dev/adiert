// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { resolveSiteUrl } from '@/lib/env';

describe('resolveSiteUrl', () => {
  it('prefers the private canonical site URL', () => {
    expect(
      resolveSiteUrl({
        SITE_URL: 'https://adiert.hu/path-that-must-not-become-the-base',
        VERCEL_PROJECT_PRODUCTION_URL: 'adiert.vercel.app',
      }),
    ).toBe('https://adiert.hu');
  });

  it('accepts quoted legacy values without breaking an existing deployment', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: ' "https://adiert.vercel.app" ' })).toBe(
      'https://adiert.vercel.app',
    );
  });

  it('adds HTTPS to a configured production hostname', () => {
    expect(resolveSiteUrl({ SITE_URL: 'adiert.hu' })).toBe('https://adiert.hu');
  });

  it('ignores an invalid manual value and uses the Vercel production domain', () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'not a valid URL',
        VERCEL_PROJECT_PRODUCTION_URL: 'adiert.vercel.app',
      }),
    ).toBe('https://adiert.vercel.app');
  });

  it('uses the generated deployment domain when no production domain is exposed', () => {
    expect(resolveSiteUrl({ VERCEL_URL: 'adiert-git-main-team.vercel.app' })).toBe(
      'https://adiert-git-main-team.vercel.app',
    );
  });

  it('keeps local development working with no configuration', () => {
    expect(resolveSiteUrl({})).toBe('http://localhost:3000');
    expect(resolveSiteUrl({ SITE_URL: 'localhost:3000' })).toBe('http://localhost:3000');
  });
});
