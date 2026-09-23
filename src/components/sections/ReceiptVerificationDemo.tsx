import Link from 'next/link';
import { ArrowRight, Camera, LockKeyhole } from 'lucide-react';

const steps = [
  {
    title: 'Lépj be az iskolád felületére',
    description:
      'A saját tanári fiókoddal tudsz beküldeni. Az iskolát nem kell minden alkalommal újra kiválasztanod.',
  },
  {
    title: 'Add hozzá a fotót és a darabszámot',
    description:
      'Válaszd ki a képet, írd be a visszaváltott palackok számát és a visszaváltás dátumát. Beküldés előtt mindent átnézhetsz.',
  },
  {
    title: 'Kövesd a beküldésed állapotát',
    description:
      'Az ellenőrzők átnézik a képet. Jóváhagyás után a palackok hozzáadódnak az iskola eredményéhez. Ha javítás kell, megírjuk, mit pontosíts.',
  },
];

export function ReceiptVerificationDemo() {
  return (
    <section
      aria-labelledby="submission-guide-title"
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold text-blue-600">Visszaváltás után</p>
        <h2
          id="submission-guide-title"
          className="text-3xl leading-tight font-extrabold tracking-tight text-[#0B1535] sm:text-4xl"
        >
          A gyűjtés kész.
          <br />
          Kerüljön fel az iskolátokhoz is.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
          A visszaváltást egy fotóval tudjátok igazolni. A beküldést az iskola egyik regisztrált
          tanára intézi.
        </p>
      </div>

      <div className="mt-8 grid min-w-0 gap-8 md:mt-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <aside
          className="self-start rounded-2xl bg-[#F5F3EE] p-5 sm:p-7"
          aria-labelledby="photo-reminder-title"
        >
          <Camera className="mb-5 size-7 text-[#0B1535]" strokeWidth={1.5} aria-hidden="true" />
          <h3 id="photo-reminder-title" className="text-xl font-bold tracking-tight text-[#0B1535]">
            A fotót még fizetés előtt készítsd el.
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
            Az automata képernyőjét fotózd le, amikor már minden palackot bedobtál. A visszaváltott
            darabszám legyen jól olvasható.
          </p>
          <p className="mt-5 border-t border-slate-300/70 pt-5 text-sm leading-6 text-slate-600">
            Nézd meg a képet, mielőtt továbblépsz a fizetésre. Ha homályos vagy becsillan, készíts
            egy másikat.
          </p>
        </aside>

        <div className="min-w-0">
          <ol className="divide-y divide-slate-200 border-y border-slate-200">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[2rem_minmax(0,1fr)] sm:gap-4 sm:py-6"
              >
                <span
                  className="pt-0.5 text-sm font-semibold text-slate-400 tabular-nums"
                  aria-hidden="true"
                >
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0B1535] sm:text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="/tanar/feltoltes"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 sm:w-auto"
          >
            Beküldöm a visszaváltást
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500 sm:text-sm">
            <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>A fotót csak az iskolád csapata és az ellenőrzők láthatják.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
