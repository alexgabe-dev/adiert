export const RETURN_METHODS = [
  {
    id: 'after',
    title: '1. módszer: először a palackok',
    subtitle: 'Ha az automata a fizetésnél kéri az egyedi QR-kódot.',
    steps: [
      {
        title: 'Dobáld be a palackokat!',
        text: 'Helyezd az automatába a visszaváltható palackokat, dobozokat és üvegeket.',
      },
      {
        title: 'Fotózd le a képernyőt!',
        text: 'Még a fizetés előtt készíts éles képet a kijelzőről. A visszaváltott palackok darabszáma jól látszódjon: ezt a fotót kell majd feltölteni az iskolához.',
      },
      {
        title: 'Válaszd a banki utalást!',
        text: 'Nyomd meg a „Fizetés” gombot, majd válaszd a „Banki utalás” lehetőséget.',
      },
      {
        title: 'Olvasd be Ádi egyedi QR-kódját!',
        text: 'Az „Olvasd be az egyedi azonosítót!” felszólításnál tartsd Ádi QR-kódját az olvasóhoz.',
      },
      {
        title: 'Ellenőrizd: „Szia Alapítvány”!',
        text: 'Várd meg ezt a feliratot. Ha nem jelenik meg, nem igazolt, hogy a megfelelő kedvezményezettet választottad; kérj segítséget a helyszínen.',
      },
    ],
  },
  {
    id: 'before',
    title: '2. módszer: először a QR-kód',
    subtitle: 'Ha az automata a visszaváltás elején kéri az egyedi QR-kódot.',
    steps: [
      {
        title: 'Olvasd be Ádi egyedi QR-kódját!',
        text: 'Még a palackok bedobása előtt keresd az „Olvasd be az egyedi azonosítót!” feliratot, és olvasd be Ádi QR-kódját.',
      },
      {
        title: 'Várd meg: „Szia Alapítvány”!',
        text: 'Csak a felirat megjelenése után kezdd el a visszaváltást. Ha nem jelenik meg, kérj segítséget a helyszínen.',
      },
      {
        title: 'Dobáld be a palackokat!',
        text: 'Helyezd az automatába a visszaváltható palackokat, dobozokat és üvegeket.',
      },
      {
        title: 'Fotózd le a képernyőt!',
        text: 'Az összes palack bedobása után, még a banki utalás előtt készíts éles fotót a kijelzőről, jól olvasható darabszámmal.',
      },
      {
        title: 'Nyomd meg a „Banki utalás” gombot!',
        text: 'A képernyő lefotózása után ezzel fejezd be a visszaváltást.',
      },
    ],
  },
];

export const REGISTRATION_STEPS = [
  'Nyisd meg a www.palackverseny.hu oldalt.',
  'Add meg az iskola irányítószámát.',
  'Add meg a települést vagy várost.',
  'Írd be az iskola hivatalos nevét.',
  'Add meg a kapcsolattartó nevét.',
  'Add meg a hozzáféréshez használt e-mail-címet.',
  'Kérj megerősítési kódot.',
  'Válaszd az „Iskola regisztrálása” lehetőséget.',
  'Erősítsd meg az e-mail-címet a kapott üzenet alapján.',
];
