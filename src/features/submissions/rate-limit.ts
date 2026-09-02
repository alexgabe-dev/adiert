import 'server-only';

import { createHmac, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const deviceTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const rateLimitResultSchema = z.array(
  z.object({
    allowed: z.boolean(),
    retry_after_seconds: z.number().int().positive(),
  }),
);

export class SubmissionRateLimitError extends Error {
  constructor(
    public readonly reason: 'limited' | 'unavailable',
    public readonly retryAfterSeconds = 60,
  ) {
    super(reason);
    this.name = 'SubmissionRateLimitError';
  }
}

export function getOrCreateDeviceToken(value: string | undefined) {
  const parsed = deviceTokenSchema.safeParse(value);
  return parsed.success ? parsed.data : randomBytes(32).toString('base64url');
}

export function hashSubmissionKey(secret: string, namespace: string, value: string) {
  return createHmac('sha256', secret).update(`${namespace}:${value}`).digest('hex');
}

export function getRequestAddress(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
  return address.slice(0, 128);
}

export async function enforceSubmissionRateLimits(
  client: SupabaseClient,
  input: { address: string; deviceToken: string; secret: string },
) {
  const checks = [
    {
      scope: 'ip_short',
      key: hashSubmissionKey(input.secret, 'ip', input.address),
      maximum: 5,
      windowSeconds: 15 * 60,
    },
    {
      scope: 'ip_daily',
      key: hashSubmissionKey(input.secret, 'ip', input.address),
      maximum: 25,
      windowSeconds: 24 * 60 * 60,
    },
    {
      scope: 'device_short',
      key: hashSubmissionKey(input.secret, 'device', input.deviceToken),
      maximum: 5,
      windowSeconds: 15 * 60,
    },
    {
      scope: 'device_daily',
      key: hashSubmissionKey(input.secret, 'device', input.deviceToken),
      maximum: 20,
      windowSeconds: 24 * 60 * 60,
    },
    {
      scope: 'global_minute',
      key: hashSubmissionKey(input.secret, 'global', 'receipt-submissions'),
      maximum: 120,
      windowSeconds: 60,
    },
  ];

  for (const check of checks) {
    const { data, error } = await client.rpc('check_submission_rate_limit', {
      requested_scope: check.scope,
      requested_key_hash: check.key,
      maximum_requests: check.maximum,
      window_seconds: check.windowSeconds,
    });

    if (error) {
      throw new SubmissionRateLimitError('unavailable');
    }

    const parsed = rateLimitResultSchema.safeParse(data);
    const result = parsed.success ? parsed.data[0] : null;
    if (!result) {
      throw new SubmissionRateLimitError('unavailable');
    }
    if (!result.allowed) {
      throw new SubmissionRateLimitError('limited', result.retry_after_seconds);
    }
  }
}
