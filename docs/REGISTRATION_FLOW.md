# Tanári regisztráció és iskolai jóváhagyás

1. Négyjegyű irányítószám → település. Több településnél kötelező választani.
2. Csak az adott település aktív, választható iskolái jelennek meg. A név szerinti szűrés azonnal, helyben történik; az irányítószám-lekérés késleltetett, megszakítható. Új irányítószám vagy település törli az előző iskolaválasztást.
3. Kapcsolattartó neve, e-mail-címe és jelszó. A szerver újra ellenőrzi az iskola–település–irányítószám összetartozását.
4. A regisztráció adatai a Supabase Auth-fiókkal együtt mentődnek. E-mail-megerősítéskor adatbázis-trigger hozza létre a függő jelentkezést, kanonikus iskolanévvel és településsel. A trigger nem ad tagságot vagy adminjogot.
5. Függő vagy elutasított jelentkezéssel a normál tanári belépés nem ad munkamenetet: a felhasználó tájékoztatást kap. A megerősítő callback is kilépteti a függő jelentkezőt.
6. Adminjóváhagyás után a meglévő döntési folyamat aktív iskolai tagságot hoz létre, és értesítést tesz a levélküldési sorba. A következő belépés sikeres lehet.

A meghívott kollégák továbbra is az iskola adminjának meghívását fogadják el. Az ilyen regisztráció nem hoz létre új iskolatulajdonosi kérelmet. A javításra visszaküldött jelentkezéshez és a régi, hiányos fiókok befejezéséhez korlátozott ügyintézési hozzáférés megmarad; ezek nem jogosítanak feltöltésre. A jelszó-visszaállítás jóváhagyás előtt is használható, de nem ad iskolai tagságot.

Az importált jegyzék intézményeinek típusa eredetileg `other`. Ezeket az importált rekordokat is engedjük kiválasztani és adminisztrátori ellenőrzésre beküldeni; a forrás szerinti besorolásuk nem változik meg. A nem importált, tetszőleges `other` rekordokra ez a kivétel nem vonatkozik.

A Magyar Posta jegyzékéből származó irányítószámok forrása: `docs/POSTAL_CODES.md`. Nem kell külső címkereső szolgáltatás a regisztráció használatához.

## Ellenőrzés

- Komponenspróbák: iskolanév-szűrés, kiválasztás, irányítószám-váltás, több település, hálózati hiba.
- Jogosultságpróbák: függő kérelem, aktív tagság és iskola, szüneteltetés, meghívó, javítás, adatbázishiba.
- PostgreSQL-próba: megerősítés előtt nincs ellenőrzési kérelem; utána függő kérelem van, tagság nincs. Önjóváhagyás tiltott. Admin jóváhagyhat importált iskolát. Ismételt megerősítés nem írja felül a döntést.
- A kapcsolt Supabase-projekten ideiglenes tesztfiókkal igazoltuk a jelentkezés automatikus létrejöttét, a függő belépés tiltását és a feltöltési oldal elérhetetlenségét. A tesztfiókot és kérelmét eltávolítottuk, e-mailt nem küldtünk.

Az adatbázis-migráció felkerült a kapcsolt Supabase-projektbe. Az alkalmazáskódot a szokásos push/deploy teszi élessé. A valódi levelek kézbesítéséhez a korábban jelzett Auth SMTP és alkalmazásértesítési szolgáltató beállítása továbbra is szükséges. Valódi telefonos böngészőpróba nem történt.
