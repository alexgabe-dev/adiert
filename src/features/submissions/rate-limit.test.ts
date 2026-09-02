// @vitest-environment node

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  enforceSubmissionRateLimits,
  getOrCreateDeviceToken,
  getRequestAddress,
  hashSubmissionKey,
  SubmissionRateLimitError,
} from '@/features/submissions/rate-limit';

describe('submission abuse controls', () => {
  it('stores only stable HMAC digests, never raw addresses or device identifiers', () => {
    const rawAddress = '203.0.113.14';
    const rawDevice = 'device-value';
    const addressHash = hashSubmissionKey('a-secret-at-least-32-characters', 'ip', rawAddress);
    const deviceHash = hashSubmissionKey('a-secret-at-least-32-characters', 'device', rawDevice);

    expect(addressHash).toMatch(/^[a-f0-9]{64}$/);
    expect(deviceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(addressHash).not.toContain(rawAddress);
    expect(deviceHash).not.toContain(rawDevice);
    expect(addressHash).not.toBe(deviceHash);
  });

  it('uses the first proxy address and bounds hostile header input', () => {
    expect(getRequestAddress(new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' }))).toBe(
      '203.0.113.1',
    );
    expect(getRequestAddress(new Headers({ 'x-real-ip': 'x'.repeat(200) }))).toHaveLength(128);
  });

  it('accepts a valid device token and replaces untrusted values', () => {
    const generated = getOrCreateDeviceToken(undefined);
    expect(generated).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(getOrCreateDeviceToken(generated)).toBe(generated);
    expect(getOrCreateDeviceToken('attacker-controlled')).not.toBe('attacker-controlled');
  });

  it('checks all layered limits with hashed keys', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 60 }],
      error: null,
    });
    await enforceSubmissionRateLimits({ rpc } as unknown as SupabaseClient, {
      address: '203.0.113.10',
      deviceToken: getOrCreateDeviceToken(undefined),
      secret: 'a-secret-at-least-32-characters',
    });

    expect(rpc).toHaveBeenCalledTimes(5);
    for (const [, values] of rpc.mock.calls) {
      expect(values.requested_key_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(JSON.stringify(values)).not.toContain('203.0.113.10');
    }
  });

  it('fails closed when the database limiter is unavailable', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'offline' } });
    await expect(
      enforceSubmissionRateLimits({ rpc } as unknown as SupabaseClient, {
        address: '203.0.113.10',
        deviceToken: getOrCreateDeviceToken(undefined),
        secret: 'a-secret-at-least-32-characters',
      }),
    ).rejects.toMatchObject({ reason: 'unavailable' });
  });

  it('stops immediately when any layer is over limit', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ allowed: false, retry_after_seconds: 321 }],
      error: null,
    });
    const promise = enforceSubmissionRateLimits({ rpc } as unknown as SupabaseClient, {
      address: '203.0.113.10',
      deviceToken: getOrCreateDeviceToken(undefined),
      secret: 'a-secret-at-least-32-characters',
    });

    await expect(promise).rejects.toEqual(new SubmissionRateLimitError('limited', 321));
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
