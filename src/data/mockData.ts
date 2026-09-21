import { FaqItem } from '../types';

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Általános',
    question: 'Hogyan segít a palackgyűjtés Ádinak?',
    answer:
      'A visszaváltási díjat Ádi egyedi QR-kódjával és a „Banki utalás” lehetőséggel ajánljuk fel. Minden alkalommal ellenőrizd a „Szia Alapítvány” feliratot. Az automata képernyőjéről készült fotó alapján, ellenőrzés után kerül be a gyűjtés az iskola eredményébe.',
  },
  {
    id: 'faq-2',
    category: 'Visszaváltás',
    question: 'Mikor kell beolvasni a QR-kódot?',
    answer:
      'Ez automatától függ. Az egyik módszernél előbb bedobod a palackokat és lefotózod a képernyőt, majd a „Fizetés” → „Banki utalás” után olvasod be a QR-kódot. A másiknál a QR-kód beolvasása és a „Szia Alapítvány” felirat megjelenése az első lépés, ezt követi a bedobálás, a fotózás és a banki utalás. Az első alkalom előtt ellenőrizd, hogyan működik az automatád.',
  },
  {
    id: 'faq-3',
    category: 'Képfeltöltés',
    question: 'Miről kell fotót készíteni?',
    answer:
      'Az automata képernyőjéről, az összes palack bedobása után, még a fizetés előtt. A visszaváltott darabszám jól látszódjon. Ezt a képet töltsd fel az iskolához; az eredmény csak kézi jóváhagyás után változik.',
  },
  {
    id: 'faq-4',
    category: 'Iskoláknak',
    question: 'Hogyan regisztrálhat az iskola?',
    answer:
      'Az általános iskolák a www.palackverseny.hu oldalon regisztrálhatnak. Szükség van az irányítószámra, a településre, az iskola hivatalos nevére, a kapcsolattartó nevére és e-mail-címére. A megerősítési kód kérése és az iskola regisztrálása után az e-mail-címet is meg kell erősíteni.',
  },
  {
    id: 'faq-5',
    category: 'Visszaváltás',
    question: 'Mi van, ha nem jelenik meg a „Szia Alapítvány” felirat?',
    answer:
      'Ne tekintsd megfelelően célzott adománynak a visszaváltást. Ellenőrizd, hogy Ádi egyedi QR-kódját használod, és kérj segítséget a helyszínen a lezárás előtt. Utólag a lezárt visszaváltás már nem irányítható át Ádi támogatására a versenyben.',
  },
  {
    id: 'faq-6',
    category: 'Gyűjtés',
    question: 'Hány palackkal induljunk visszaváltani?',
    answer:
      'Kérjük, először gyűjtsetek össze legalább 50 darabot. Így kevesebb képet kell kezelnie és feltöltenie a kapcsolattartó tanárnak. A visszaváltást a gyerekek tanári kísérettel, illetve a segítő szülők is elvégezhetik.',
  },
  {
    id: 'faq-7',
    category: 'Visszaváltás',
    question: 'Mi történik, ha elmaradt a képernyő lefotózása?',
    answer:
      'A feltöltéshez jól olvasható képernyőfotó szükséges. Ha ez elmaradt, egyeztess a szervezőkkel az info@adiert.hu címen; a gyűjtés beszámítása nem automatikus.',
  },
];
