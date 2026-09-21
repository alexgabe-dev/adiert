# Iskolai portál – üzembe helyezés és ellenőrzés

## Elkészült felületek

- `/tanar/regisztracio`: saját tanári fiók létrehozása.
- `/tanar/belepes`: e-mail/jelszó belépés, megerősítés újraküldése, jelszó-visszaállítás.
- `/tanar/jelentkezes`: iskolakeresés, jelentkezés és jóváhagyási állapot.
- `/tanar/meghivasok`: a megerősített e-mail-címre érkezett meghívások elfogadása.
- `/tanar`: mobilos iskolai kezdőlap, az aktív kampány összesített eredménye és mérföldköve.
- `/tanar/feltoltes`: háromlépéses, saját iskolához kötött beküldés.
- `/tanar/bekuldesek`: állapotok, visszajelzés, javítás utáni újrafeltöltés.
- `/tanar/iskolam`: kapcsolattartók és tanári meghívások.
- `/admin/jelentkezesek`: jóváhagyás, pontosításkérés, elutasítás, meglévő iskola összekapcsolása.
- `/admin/iskolak/[id]`: áttekintés, képes ellenőrzés, kapcsolattartók, adatok, előzmények, CSV-export.
- `/admin/bekuldesek`: ellenőrzői munkasor. A reviewer ellenőrizhet; lezárt eredményt csak admin/super_admin korrigálhat.
- `/admin/ertesitesek`: tartós levélküldési sor, hibák és újrapróbálás.

## Beállítások

A helyi `.env.local` tartalmazza a kiválasztott Supabase-projekt kapcsolatát; ez a fájl Gitből kizárt. Az `.env.example` kizárólag helykitöltő mintákat tartalmaz. A kód és az izolált PostgreSQL-tesztek konfiguráció nélkül is buildelhetők; más környezetben az alábbiak szükségesek.

1. A cél Supabase projektben az előző migrációk után alkalmazd a `supabase/migrations/20260921000100_school_portal.sql` migrációt. Meglévő adatok nem törlődnek; a régi beküldések tanári adatai null értékűek maradnak.
2. Állítsd be a `.env.example` szerveroldali változóit. A `SITE_URL` a tényleges saját domain legyen. A `SUBMISSION_RATE_LIMIT_SECRET` legalább 32 karakteres titok.
3. Supabase Auth: engedélyezett e-mail/jelszó regisztráció és **bekapcsolt e-mail-megerősítés**. Állíts be SMTP-t, a saját `SITE_URL` értéket és a `/auth/callback` útvonalra vezető engedélyezett átirányításokat (a `next=/tanar` és `next=/tanar/jelszo` változatokkal). Az alapértelmezett `ConfirmationURL` sablonokat használja a folyamat. Az e-mailes hivatkozást ugyanabban a böngészőben kell megnyitni, ahol a regisztráció/jelszókérés indult (PKCE).
4. A meglévő admin létrehozási folyamat szerint legyen legalább egy aktív `super_admin` felhasználó az `administrators` táblában. Az adminmeghívások továbbra is meghívásosak.
5. Hozz létre/aktiválj egy dátum szerint is aktív kampányt. A regisztráció elfogadása az iskolát az akkor aktív kampányhoz kapcsolja. Új kampánynál a meglévő admin kampánykezelővel kell az iskolákat résztvevőként hozzáadni.
6. Állíts be egy Resend küldési kulcsot (`RESEND_API_KEY`) és ellenőrzött feladót (`NOTIFICATION_FROM`). A fiókmegerősítést és a jelszó-visszaállítást a Supabase SMTP küldi; a döntéseket és iskolai meghívókat a Resend.
7. Futtass egy ütemezett HTTPS GET kérést percenként a `/api/notifications/dispatch` végponton `Authorization: Bearer <NOTIFICATION_CRON_SECRET>` fejléccel. A döntések után a rendszer rögtön megkísérli a háttérküldést; az ütemezett hívás a maradék és hibás leveleket dolgozza fel. A titok legalább 32 véletlen karakter legyen.

## Működési szabályok

- Egy fióknak egy aktív iskolai tagsága lehet. Egy iskolában egy iskolai admin és legfeljebb 10 további tanár lehet. Az érvényes függő meghívó helyet foglal. Az iskolasor zárolása a párhuzamos meghívásoknál is védi a korlátot.
- A tagság/jelentkezés/meghívás közvetlen kliensoldali írása tiltott. A módosítások ellenőrzött adatbázisfüggvényeken keresztül történnek.
- A korábbi nyilvános `/api/submissions` végpont most megerősített fiókot és aktív tagságot kér. Az iskola, a beküldő és a kampány a szerverről származik. A küldött darabszám állítás, nem jóváhagyott eredmény.
- 50 darab alatti beküldéshez legalább 5 karakteres indoklás szükséges. A jóváhagyott összeg darabszám × 50 Ft.
- A beküldésekhez tartozó képek privát tárhelyen vannak. Képolvasáshoz minden alkalommal jogosultság-ellenőrzés történik, majd rövid élettartamú aláírt hivatkozás készül.
- A javítás új változatot hoz létre az eredeti beküldésen belül; a régi kép megmarad. A verzióellenőrzés kizárja a másik ellenőrző vagy tanár módosításának észrevétlen felülírását.
- A jóváhagyott darabszám eltérését, elutasítást, javításkérést és lezárt eredmény korrekcióját indokolni kell. A publikus eredmények minden döntés után újraszámolódnak.
- A tanári kezdőlap aktív kampányt mutat; a központi iskolaáttekintés összesített, kampányokon átívelő adatokat mutat.
- Az értesítés a döntéssel egy adatbázis-tranzakcióban kerül a küldési sorba. Hiányzó levélküldési beállítás nem veszít el döntést/értesítést. Küldéskor legfeljebb 5 levél foglalható le egyszerre, szolgáltatói idempotenciakulccsal. A `sent` állapot szolgáltatói átvételt jelent, nem postaládába kézbesítési igazolást. Öt sikertelen kísérlet után admini újrapróbálás szükséges.
- Bizonytalan hálózati eredményű adatbázis-mentés után a feltöltött képet nem töröljük, mert a mentés megtörténhetett. Ezek esetleges árva objektumainak takarításakor mind az aktuális képeket, mind a változattörténetet figyelembe kell venni.

## Ellenőrzés

### Beállított fejlesztői belépés

A helyi alkalmazás címe `http://localhost:3001`, háttere a felhasználó által megadott Supabase-projekt. A három függő migráció alkalmazva lett, a két fiók megerősített e-mail-címmel rendelkezik:

- Főadmin: `admin@adiert.test`, jelszó: `AdiAdmin2026!`, belépés: `/admin/login`.
- Iskolai admin: `tanar@adiert.test`, jelszó: `AdiTanar2026!`, belépés: `/tanar/belepes`.
- A tanári fiók az „Ádiért Tesztiskola (helyi minta)” tulajdonosa. Ezek kizárólag tesztelésre létrehozott adatok; e-mail-kézbesítéshez valódi cím és szolgáltatói beállítás szükséges.
- Az admin jelszavas belépése `LOCAL_TEST_LOGIN=true`, `NODE_ENV=development` és helyi HTTP `SITE_URL` mellett érhető el. A Supabase lehet távoli; production környezetben ez a tesztbelépési lehetőség tiltott.
- Újralétrehozás: `node --experimental-websocket scripts/seed-local-portal.mjs --project-ref=<a konfigurált projekt azonosítója>`. Távoli projektnél az explicit, egyező azonosító kötelező. A parancs a két tesztfiók jelszavát visszaállítja, és a mintaiskolát a meglévő aktív kampányhoz kapcsolja. Más felhasználói fiókokat nem módosít.

HTTP-űrlapteszttel ellenőrizve: mindkét bejelentkezés 303-as átirányítást ad a megfelelő védett kezdőlapra, a kezdőlapok betöltődnek. Az admin iskola- és jelentkezési listája is elérhető.

### Automatizált ellenőrzések

- `npm run test`: alkalmazás- és feltöltési tesztek. A tesztkeresés a repository saját `src` és `scripts` mappájára korlátozott; beágyazott `.kilo` worktree-k régi tesztjeit nem futtatja a jelenlegi források ellen.
- `npm run test:db`: izolált PostgreSQL adatbázisban az összes migráció és RLS-teszt. A `007_school_portal.sql` lefedi a megerősítés/jóváhagyás előfeltételeit, a 10 tanáros korlátot, az iskolák elválasztását, az ismételt beküldést, javítási változatot, ütköző ellenőrzést, eredménykorrekciót és a tagság visszavonását.
- `npm run typecheck`, `npm run lint`, `npm run build`.
- Élesítés előtt két tesztiskolával és külön tanári/ellenőrzői/főadmin fiókkal végezd el a regisztráció → e-mail → jóváhagyás → meghívás → feltöltés → javítás → jóváhagyás folyamatot. A valódi SMTP/Resend-kézbesítés csak beállított szolgáltatással ellenőrizhető.

Implementációs hivatkozások: [Next.js háttérfeladatok](https://nextjs.org/docs/app/api-reference/functions/after), [Resend levélküldési API](https://resend.com/docs/api-reference/emails/send-email).
