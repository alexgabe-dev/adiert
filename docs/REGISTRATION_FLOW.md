# Iskolai jelentkezés és levelezés

2026-09-24: az admin jóváhagyása megelőzi az e-mail-cím megerősítését.

1. A tanár irányítószám és település alapján kiválasztja az iskolát, megadja a nevét, címét és jelszavát.
2. A szerver korlátozza a próbálkozásokat, majd ellenőrizetlen Auth-fiókot hoz létre. Nem küld Supabase signup-levelet.
3. Az adatbázistrigger ugyanabban a tranzakcióban pending jelentkezést és visszaigazoló levelet hoz létre. A levélben nincs aktiválási gomb.
4. Az admin döntése tranzakcióban létrehozza a tagságot és az elfogadó levelet. A jóváhagyás nem erősíti meg az e-mail-címet.
5. A levél 7 napos, egyszer használható linket tartalmaz. A megnyitás önmagában nem használja el: a tanár a megerősítő oldalon megnyomja a gombot.
6. A szerver ellenőrzi a token lejáratát, felhasználását, az aktuális e-mail-címet és az aktív tagságot/meghívást, majd Supabase OTP-val megerősíti a címet és belépteti a tanárt.

A tokenek SHA-256 lenyomata külön, csak service role által olvasható táblában tárolódik. A levélben lévő token HMAC-ból készül; újraküldési próbánál azonos marad. A titok a meglévő SUBMISSION_RATE_LIMIT_SECRET. Lejárt link esetén a belépési oldalon kérhető új levél. Minden új levél saját tokennel rendelkezik.

Meghívott kollégánál a meglévő iskolai meghívás jogosít aktiválásra; nem jön létre második iskolatulajdonosi jelentkezés. Pontosításkérésnél és elutasításnál nincs aktiválási link, a tanár a kapcsolatfelvételi címen válaszolhat. Korábbi megerősített fiókok továbbra is használhatók.

## Adminüzenetek

Az /admin/uzenetek oldalon admin vagy főadmin kereshet aktív tanárokat név/e-mail alapján. A keresés megőrzi a címzetteket és a szöveget. Legfeljebb 50 címzett jelölhető; küldés előtt kötelező az előnézet. A címzettek külön levelet kapnak. A szerver és az adatbázis is ellenőrzi a jogosultságot és a címzetteket. Egy üzenetazonosító ismételt beküldése nem hoz létre második levelet. A küldés naplózott, az állapot az Értesítések oldalon látható.

A levelek HTML és szöveges változatot kapnak. A tárgy és a törzs HTML-escape-elt. Az after háttérfeladat ötös csoportokban, korlátozott sebességgel üríti a sort, legfeljebb 100 levelet egy futásban. Az új levelek elsőbbséget élveznek a hibás próbák előtt. Szolgáltatói hiba esetén a levél megmarad, az admin újrapróbálhatja. Külső rendszeres diszpécser továbbra is az /api/notifications/dispatch végpontot hívhatja NOTIFICATION_CRON_SECRET Bearer tokennel; automatikus cron nincs beállítva.

## Ellenőrzés

- SQL: atomikus jelentkezés/visszaigazolás, adminengedély, egyszeri és lejárt token, üzenet-idempotencia.
- UI-komponensteszt: keresés közben megmaradó címzettek és piszkozat, kötelező előnézet.
- Hosted próba: külön tesztiskola és Resend delivered+…@resend.dev cím; valódi Auth-létrehozás, döntés, levélküldés, aktiválás, jelszavas belépés, adminüzenet. A fiók törölve, az iskola archiválva, az audit megmarad.
- Opt-in hosted teszt: TEST_REMOTE_APPROVAL=true npx vitest run src/features/teacher/approval.remote.test.ts. Csak beállított .env.local mellett; három tesztlevelet küld. Más várakozó leveleket nem küld ki.
- Böngészős és valódi mobilos vizuális ellenőrzés: a munkamenetben nincs elérhető böngésző.
