import { FaqItem, HowItWorksStep } from '../types';

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    stepNumber: 1,
    title: 'Gyűjts össze palackokat!',
    shortLabel: 'Gyűjtés',
    description:
      'Vond be az osztálytársaidat, barátaidat és családodat! Gyűjtsetek össze minél több 50 Ft-os visszaváltási emblémás PET palackot és aludobozt.',
    iconType: 'bottles',
    highlight: '50 Ft / palack',
  },
  {
    stepNumber: 2,
    title: 'Váltsd vissza őket!',
    shortLabel: 'REpont automata',
    description:
      'Menj el a legközelebbi REpont automatához (pl. Spar, Aldi, Lidl, Tesco), és helyezd be az ép, sértetlen palackokat egyenként.',
    iconType: 'repont',
    highlight: 'Országszerte elérhető',
  },
  {
    stepNumber: 3,
    title: 'Fotózd le a bizonylatot!',
    shortLabel: 'QR & Bizonylat',
    description:
      'A gépnél olvasd be az Ádiért QR-kódot a jóváíráshoz, majd nyomd meg a Bizonylat kérése gombot, és készíts egy éles fotót a papírról.',
    iconType: 'camera',
    highlight: 'Ádiért QR-kód',
  },
  {
    stepNumber: 4,
    title: 'Töltsd fel és válaszd ki az iskolád!',
    shortLabel: 'Feltöltés',
    description:
      'Nyisd meg az adiert.hu-t, töltsd fel a bizonylat fotóját másodpercek alatt, és jelöld be a saját iskoládat az egyszerű keresőben.',
    iconType: 'upload',
    highlight: 'Gyors űrlap',
  },
  {
    stepNumber: 5,
    title: 'Segíts Ádinak és az iskoládnak!',
    shortLabel: 'Pontszerzés',
    description:
      'Az ellenőrzés után az összeg azonnal hozzáadódik az iskolád eredményéhez. Figyeld a ranglistát és lépjetek feljebb a dobogóra!',
    iconType: 'trophy',
    highlight: '+Pontok az iskolának',
  },
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Általános',
    question: 'Mi a kampány lényege és kihez kerül a támogatás?',
    answer:
      'A kampányban a magyarországi REpont automatáknál visszaváltott 50 Ft-os palackok díját ajánljuk fel Ádi gyógykezelésére. Az Ádiért QR-kód beolvasásával az összeg közvetlenül a hivatalos alapítványi számlára kerül, a bizonylat feltöltésével pedig a diák iskolája pontokat kap a versenyben.',
  },
  {
    id: 'faq-2',
    category: 'Visszaváltás',
    question: 'Milyen palackokat és dobozokat lehet visszaváltani?',
    answer:
      'Minden olyan műanyag, üveg vagy fém (alumínium) italcsomagolást, amelyen szerepel a visszaváltási logó és az 50 Ft felirat. Fontos, hogy a palackok ne legyenek összenyomva, és a vonalkód sértetlenül olvasható legyen a gép számára.',
  },
  {
    id: 'faq-3',
    category: 'Bizonylat',
    question: 'Hogyan történik a bizonylat ellenőrzése?',
    answer:
      'A feltöltött fotón ellenőrizzük a REpont automata bizonylatszámát, az összeget, a dátumot és az Ádiért QR tranzakciós azonosítót. A jóváhagyás átlagosan 2-4 órán belül megtörténik, és az összeg azonnal láthatóvá válik az iskola adatlapján.',
  },
  {
    id: 'faq-4',
    category: 'Iskoláknak',
    question: 'Hogyan csatlakozhat egy új iskola a ranglistához?',
    answer:
      'Bármely magyarországi alap- és középfokú iskola ingyenesen regisztrálhat. A regisztráció után biztosítunk letölthető és nyomtatható A4-es plakátokat, QR-kódos gyűjtődoboz matricákat és digitális anyagokat az iskola közösségének.',
  },
  {
    id: 'faq-5',
    category: 'Visszaváltás',
    question: 'Mit tegyek, ha nem működik az automata vagy elfelejtettem lefotózni a bizonylatot?',
    answer:
      'Ha az automata nem adott ki papírt vagy elveszett a bizonylat, a REpont applikációban a korábbi tranzakciók képernyőképe is feltölthető. Technikai hiba esetén ügyfélszolgálatunk az info@adiert.hu címen készséggel segít.',
  },
];
