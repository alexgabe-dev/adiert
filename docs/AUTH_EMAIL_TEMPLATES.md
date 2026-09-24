# Ádiért hitelesítési e-mailek

A nyolc magyar sablon a `supabase/templates/` mappában található. A tárgysorokat a `subjects.json` tartalmazza. A regisztráció és a megerősítő levél újraküldése ugyanazt a `confirmation.html` sablont használja.

| Fájl                                 | Esemény                                    |
| ------------------------------------ | ------------------------------------------ |
| `confirmation.html`                  | Regisztráció és e-mail-cím megerősítése    |
| `recovery.html`                      | Elfelejtett jelszó                         |
| `magic_link.html`                    | Jelszó nélküli belépés, például adminoknak |
| `invite.html`                        | Supabase Auth-fiókmeghívó                  |
| `email_change.html`                  | E-mail-cím módosításának megerősítése      |
| `reauthentication.html`              | Biztonsági megerősítő kód                  |
| `password_changed_notification.html` | Értesítés a megváltozott jelszóról         |
| `email_changed_notification.html`    | Értesítés a megváltozott e-mail-címről     |

A tanári csapatmeghívók és az iskolai jóváhagyás üzenetei külön alkalmazásértesítések; azokat a meglévő értesítési sor és Resend-integráció kezeli, nem a Supabase Auth-sablonok.

## Ellenőrzés és előnézet

```sh
node scripts/sync-auth-email-templates.mjs
node scripts/preview-auth-email-templates.mjs
```

Nyisd meg a `supabase/.temp/email-preview.html` fájlt. Mobilos és asztali szélesség között lehet váltani. Az előnézetben csak mintaadatok vannak; gombjai nem végeznek hitelesítést. A sablonok táblázatos elrendezést, inline stílusokat, rendszerbetűtípust és mobilos szabályokat használnak; külső képek nélkül is olvashatók.

A hitelesítési gombok és tartalék hivatkozásaik a Supabase `{{ .ConfirmationURL }}` értékét használják. A biztonsági kód `{{ .Token }}`. A jelenlegi PKCE-folyamatnál a hivatkozást abban a böngészőben kell megnyitni, ahol a kérést indították. A sablonok ezt a folyamatot nem változtatják meg.

## Éles aktiválás

2026. szeptember 24-én a Resend SMTP bekötése és mind a nyolc magyar sablon éles aktiválása megtörtént. Feladó: Ádiért · Palackverseny <info@palackverseny.hu>. Az SMTP-hitelesítés ellenőrizve; az Auth levélküldési kerete 30/óra. A Resend domain küldési és fogadási DNS-rekordjai hitelesítettek. Személyes postaládába továbbítás külön beállítást igényel.

Az SMTP-beállításhoz a szolgáltató hostja, portja, felhasználóneve, jelszava/API-kulcsa és ellenőrzött feladói címe szükséges. Titkos adatot ne írj a repóba vagy a beszélgetésbe. Beállítás: Supabase Dashboard → Authentication → Email → SMTP Settings.

A szolgáltató bekötése után a bejelentkezett fiók Management API-tokenjével futtatható:

```sh
node scripts/sync-auth-email-templates.mjs --apply
```

A token a `SUPABASE_ACCESS_TOKEN` környezeti változóból érkezik. A script csak a nyolc tárgyat és sablont módosítja, menti az előző értékeket az ignorált `supabase/.temp/` mappába, és visszaolvassa az eredményt. SMTP-titkokat nem ment és nem ír ki. Tesztlevelet nem küld.

A jelszó- és e-mail-cím-változás biztonsági értesítői jelenleg ki vannak kapcsolva a projektben. Sablonjuk elkészült; küldésük külön engedélyezhető a Supabase beállításaiban. A script nem módosítja ezt a kapcsolót.

A projekt Site URL-je javítva lett `https://www.palackverseny.hu` értékre. Az éles és a támogatott helyi `/auth/callback` útvonalak bekerültek az engedélyezett visszatérési címek közé. A Supabase signUp → Resend SMTP → Resend tesztcím folyamat sikeres volt; a kézbesítési esemény delivered, a megerősítő levél visszatérési címe https://www.palackverseny.hu/auth/callback. Az ideiglenes tesztfiók törölve. Valódi Gmail/Outlook postaládás és mobilos vizuális próba még nem történt.

Forrás: [Supabase e-mail-sablonok](https://supabase.com/docs/guides/auth/auth-email-templates).
