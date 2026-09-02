import 'server-only';

import { z } from 'zod';

import { getPublicSupabaseEnvironment } from '@/lib/supabase/config';

function normalizeSiteUrl(value: string | undefined) {
  let candidate = value?.trim();
  if (!candidate) return null;

  const hasMatchingQuotes =
    (candidate.startsWith('"') && candidate.endsWith('"')) ||
    (candidate.startsWith("'") && candidate.endsWith("'"));
  if (hasMatchingQuotes) candidate = candidate.slice(1, -1).trim();
  if (!candidate) return null;

  if (!candidate.includes('://')) {
    const protocol = /^(localhost|127\.0\.0\.1)(:|$)/i.test(candidate) ? 'http' : 'https';
    candidate = `${protocol}://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(values: Readonly<Record<string, string | undefined>>) {
  const configuredUrl =
    normalizeSiteUrl(values.SITE_URL) ?? normalizeSiteUrl(values.NEXT_PUBLIC_SITE_URL);
  if (configuredUrl) return configuredUrl;

  const vercelUrl =
    normalizeSiteUrl(values.VERCEL_PROJECT_PRODUCTION_URL) ?? normalizeSiteUrl(values.VERCEL_URL);
  return vercelUrl ?? 'http://localhost:3000';
}

export const environment = Object.freeze({ SITE_URL: resolveSiteUrl(process.env) });

const privilegedEnvironmentSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

const submissionSecurityEnvironmentSchema = z.object({
  SUBMISSION_RATE_LIMIT_SECRET: z.string().min(32),
});

export function getPrivilegedSupabaseEnvironment() {
  const publicEnvironment = getPublicSupabaseEnvironment();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicEnvironment || !serviceRoleKey) {
    return null;
  }

  const parsedPrivilegedEnvironment = privilegedEnvironmentSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  });

  if (!parsedPrivilegedEnvironment.success) {
    throw new Error(
      `Invalid privileged Supabase configuration: ${z.prettifyError(parsedPrivilegedEnvironment.error)}`,
    );
  }

  return Object.freeze({
    ...publicEnvironment,
    ...parsedPrivilegedEnvironment.data,
  });
}

export function getSubmissionSecurityEnvironment() {
  const parsedSubmissionSecurityEnvironment = submissionSecurityEnvironmentSchema.safeParse({
    SUBMISSION_RATE_LIMIT_SECRET: process.env.SUBMISSION_RATE_LIMIT_SECRET,
  });

  if (!parsedSubmissionSecurityEnvironment.success) {
    return null;
  }

  return Object.freeze(parsedSubmissionSecurityEnvironment.data);
}
