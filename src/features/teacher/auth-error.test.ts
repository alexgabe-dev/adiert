import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './auth-error';

describe('auth failure messages', () => {
  it('distinguishes the email quota from a short request cooldown', () => {
    expect(authErrorMessage({ code: 'over_email_send_rate_limit', status: 429 })).toContain(
      'levélküldési keretet',
    );
    expect(authErrorMessage({ status: 429 })).toContain('néhány percet');
  });
  it('explains a sender configuration failure', () => {
    expect(authErrorMessage({ code: 'email_address_not_authorized' })).toContain(
      'nincs megfelelően beállítva',
    );
  });
  it('does not disclose whether an account exists', () => {
    expect(authErrorMessage({ code: 'user_already_exists' })).toBe(
      authErrorMessage({ code: 'unexpected_failure' }),
    );
  });
});
