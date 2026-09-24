type AuthFailure = { code?: string; status?: number };

// Keep account existence and provider diagnostics out of public responses.
export function authErrorMessage(error: AuthFailure): string {
  if (error.code === 'over_email_send_rate_limit')
    return 'Most nem tudunk megerősítő e-mailt küldeni, mert elértük a levélküldési keretet. Próbáld meg később. Ha a hiba megmarad, jelezd nekünk: info@palackverseny.hu.';
  if (error.code === 'over_request_rate_limit' || error.status === 429)
    return 'Túl sok próbálkozás történt rövid idő alatt. Várj néhány percet, majd próbáld újra.';
  if (error.code === 'email_address_not_authorized' || error.code === 'email_provider_disabled')
    return 'Az e-mail-küldés jelenleg nincs megfelelően beállítva. Kérjük, jelezd nekünk: info@palackverseny.hu.';
  if (error.code === 'weak_password')
    return 'Ez a jelszó nem elég erős. Adj meg egy hosszabb, egyedi jelszót.';
  return 'A művelet most nem sikerült. Próbáld újra később. Ha már van fiókod, lépj be vagy kérj új jelszót.';
}
