# Felhasználói működés és UX – 2026. szeptember 22.

## Értékelés

A korábbi felület fő problémája a kiszámíthatatlanság volt. A ranglista iskolaválasztása a saját feltöltésre vitt, több oldalcím nem nevezte meg a feladatot, a visszavonás ugyanolyan hangsúlyos kék gombot kapott, mint a mentés. A feltöltés összegzésénél nem lehetett ellenőrizni a kiválasztott fotót. Egy sikertelen űrlapbeküldés után újra kellett írni az adatokat.

A javított változatban a címsorok, a navigáció és a gombok a tényleges feladatot nevezik meg. A fő művelet kék, a másodlagos lehetőség keretes, a hozzáférés visszavonása piros. A tanári navigáció telefonon alul, nagyobb képernyőn a fejlécben van. A mezők 16 px-es szövege, a látható billentyűzetfókusz és a nagyobb érintési célok támogatják a mobilos használatot.

## Javítások

- A ranglistáról az iskola nyilvános adatlapja nyílik meg; megszűnt a félrevezető „Kiválasztás” művelet.
- Külön regisztrációs lehetőség és belépési segítség; feladatot megnevező címsorok, megjeleníthető jelszó. Bejelentkezve nem kell újra belépni vagy új fiókot létrehozni.
- Érvényes meghívással a tanár közvetlenül a meghívásokhoz jut. Az iskola jelentkezési gombja csak kiválasztott vagy kézzel megadandó iskolánál aktív.
- Hibás mentés után megmaradnak az űrlapadatok. A visszavonás megszakítható, fókuszkezeléssel ellátott megerősítő ablakban történik.
- A feltöltés összegzése fotót is mutat. Az 50 palack alatti beküldéshez pontos hibaüzenet tartozik. Javításkor használható a korábbi fotó; a kért javítás közvetlenül a feltöltés felett látszik.
- A feltöltési lépésváltás a címsorra helyezi a fókuszt. A még be nem küldött fotóval történő lapbezárásnál/újratöltésnél a böngésző figyelmeztet. Ez nem jelent háttérben mentett piszkozatot.
- Az üres szűrt lista az összes beküldéshez vezet vissza, az első használat az első feltöltéshez.
- A tanári fejlécből elérhető a visszaváltási és feltöltési útmutató.
- A lezárt admini döntés módosítása külön kinyitható részbe került. A javítás és elutasítás indoklása érthetően a tanárnak szól.
- Az ellenőrzési jelzésekre a döntés előtt figyelmeztetés hívja fel a figyelmet. A jelzések és iskolai előzmények magyar elnevezést kaptak; a technikai részletek kinyithatók.
- Javítva a felülvizsgálati Server Action exporthibája, amely a tényleges beküldésnél akadályozta a mentést.
- A nyilvános ellenőrzési példa nem váltogatja magától az állapotát. A felhasználó választása marad érvényben.
- Megszűntek a sehová nem vezető jogi hivatkozások és a nem használható QR-kód képe. A QR-kód hiányát az oldal egyértelműen jelzi, nem kínál működésképtelen letöltést.
- Az admin betöltési hibái saját, újrapróbálható hibaoldalt kaptak.

## Valós HTTP-folyamatok a konfigurált Supabase-projekttel

A `scripts/portal-smoke.mjs` az alkalmazás valódi belépési és szerverűrlapjait küldi be, kezeli a munkameneteket, és ellenőrzi a tárolt eredményt. Ez HTTP-integrációs teszt, nem böngészőautomatizálás.

| Folyamat                                                                      | Eredmény                                                              |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Nyilvános oldal szakaszhivatkozásai                                           | Létező célokra mutatnak                                               |
| Belépés, regisztráció, jelszókérés, megerősítés újraküldése                   | Oldalak betöltődnek                                                   |
| Hibás jelszó                                                                  | Érthető hiba; nincs belépés                                           |
| Admin és tanár valódi belépési űrlapja                                        | Sikeres átirányítás és védett kezdőlap                                |
| Tanári és admin navigáció, iskola öt adatlapfüle                              | Oldalak betöltődnek                                                   |
| Tanár adminhozzáférése, anonim feltöltés és fotóelérés                        | Tiltott                                                               |
| Iskolai CSV-export                                                            | Adminnak elérhető, tanárnak tiltott                                   |
| Fotó és mennyiség feltöltése, azonos kérés újraküldése                        | Saját iskola; nincs második beküldés                                  |
| Javításkérés, tanári visszajelzés és újraküldés                               | Újra ellenőrzésre vár; régi kép megmarad                              |
| Jóváhagyás, majd főadmini korrekció                                           | Állapot és eredmény módosul                                           |
| Kolléga meghívása, elfogadás                                                  | Saját iskola tagja lesz; további meghívásra nincs joga                |
| Tanári hozzáférés visszavonása                                                | A védett iskolai felülethez és feltöltéshez való hozzáférés megszűnik |
| Megerősített új fiók iskolai jelentkezése, pontosítás, újraküldés, jóváhagyás | Iskolai tulajdonosi tagság és értesítési sor létrejön                 |
| Ellenőrző szerepkör                                                           | Munkasor elérhető; iskola- és adminfiókkezelés tiltott                |
| Kijelentkezés                                                                 | Védett tanári oldalak többé nem érhetők el                            |

Az ideiglenes tesztfiókok hozzáférése le lett tiltva, az ideiglenes tesztiskola és részvétele inaktív. A mesterséges képpel beküldött gyűjtés elutasított állapotban maradt, így nem növeli a palackszámot vagy az adományösszeget. Az előzmények megmaradtak a naplóban. A korábban átadott admin- és tanári tesztfiók használható maradt.

Futtatás:

```powershell
# Olvasási ellenőrzések és belépés/kilépés
node --experimental-websocket scripts/portal-smoke.mjs

# Kizárólag az ismert tesztiskolához kötött, állapotot módosító próbák
node --experimental-websocket scripts/portal-smoke.mjs --with-test-writes
```

A feltöltésekre az éles sebességkorlát vonatkozik, ezért a módosító tesztet ne futtasd rövid időn belül ismételten.

## Interakciótesztek és korlátok

React-interakciótesztek fedik a hibás űrlap utáni adatmegőrzést, a megerősítés megszakítását, a jelszó láthatóságát, a fotó kötelezőségét, az 50 palack alatti indoklást, a végső képelőnézetet, a hálózati újrapróbálást, az ellenőrzői indoklást és a lezárt eredmény védelmét. Az adatbázistesztek a jogosultságokat, a tanárlimitet, az iskolák elkülönítését és a párhuzamos módosítások védelmét is ellenőrzik.

Nem volt csatlakoztatott böngésző. Emiatt tényleges telefonos megjelenés, képernyőképes ellenőrzés, eszközkamera és teljes böngészős kattintássor nem lett ellenőrizve. A mobilos elrendezés a komponensek és töréspontok felülvizsgálatával javult; ez nem helyettesíti a vizuális tesztet.

A valódi regisztrációs e-mail kézbesítése és a levélből történő megerősítés nem lett végigtesztelve. A csatlakozási próbákhoz előre megerősített, ideiglenes tesztfiókok készültek. A rendszer döntési értesítéseit a küldési sorban ellenőriztük; valódi kézbesítéshez a levélküldés beállítása szükséges.

A hivatalos REpont QR-kód továbbra is hiányzik. Enélkül az oldalról induló adományozási folyamat nem teljes. Jogi dokumentumot nem találtunk, és nem helyettesítettük kitalált tartalommal.

## Mobilos finomítások — 2026. szeptember 22.

A keskeny kijelzőkhöz átrendezett elemek: kampánystatisztikák, dobogó, iskolai összesítők, kézi iskolafelvétel, kampánydátumok, feltöltési gombok és ellenőrzési műveletek. A hosszú nevek és címek törhetnek; az admin fő tartalma nem kényszeríti szélesebbre a rácsot. A hero képaláírása a kép szélességén belül marad. A mobilmenü és az adminfiók elérhető tartalma görgethető.

A közös vezérlők legalább 44 pixeles érintési célt, az általános mezők 48 pixeles magasságot kaptak. A mobilos kis szövegű beviteli mezők 16 pixelesek az automatikus iOS-nagyítás elkerülésére. A kalkulátor csúszkájának érintési területe 44 pixel. A képernyőnagyítás továbbra is engedélyezett, a csökkentett mozgás beállítása megmarad.

A párbeszédablakok a Visual Viewport méretéhez és eltolásához igazodnak, figyelembe veszik a biztonságos képernyőszéleket, és hosszú tartalomnál görgethetők. Felismert mobilbillentyűzet mellett a tanári alsó menü elbújik, az ellenőrzési műveletsor pedig normál dokumentumfolyamba kerül. A modal újrarenderelése többé nem veszi el a fókuszt a gépelés alatt álló mezőről.

Új regressziós tesztek ellenőrzik a gépelési fókuszt, a billentyűzet miatti nézetváltozás kezelését, a nagyítás megkülönböztetését és az eseménykezelők takarítását. Ezek szimulált DOM-interakciók, nem képernyőképes vagy valódi eszközös mérések. Csatlakoztatott böngésző továbbra sem érhető el; a tényleges 320–430 pixeles, fekvő és nyitott billentyűzetes vizuális ellenőrzés még szükséges.
