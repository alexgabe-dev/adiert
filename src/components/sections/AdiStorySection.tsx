import Image from 'next/image';
import { ArrowRight, Activity, HeartPulse, Wind } from 'lucide-react';

export function AdiStorySection() {
  return (
    <section id="adi-tortenete" aria-labelledby="adi-story-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <figure>
            <div className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-slate-100">
              <Image
                src="/pics/optimized/adi-csalad.webp"
                alt="Ádi a szüleivel és a testvérével egy közös családi fotón"
                fill
                sizes="(min-width: 1024px) 576px, (min-width: 640px) 90vw, calc(100vw - 32px)"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-slate-500">
              Ádi és a családja. Együtt, minden nap.
            </figcaption>
          </figure>
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-blue-600 uppercase">
              Ismerd meg Ádit
            </p>
            <h2
              id="adi-story-heading"
              className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl"
            >
              Egy mosoly, ami mögött
              <br className="hidden sm:block" /> egy egész család áll.
            </h2>
            <p className="mt-5 leading-relaxed text-slate-600">
              Major Ádám 2015 augusztusában született a kárpátaljai Haláboron. Vidám, mosolygós
              kisfiúként kezdte az óvodát. A negyedik születésnapja előtt azonban egyre nehezebben
              ment neki a lépcsőzés.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              2020 januárjában genetikai vizsgálat igazolta a Duchenne-féle izomdisztrófiát. A
              család 2021-ben Besenyődre költözött. Azóta a hétköznapjaik része a rendszeres
              kezelés, a gyógytorna és az összefogás Ádi jövőjéért.
            </p>
          </div>
        </div>
        <div className="mt-14 grid gap-8 rounded-3xl bg-[#F5F8FD] p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-blue-600 uppercase">
              A betegségről röviden
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Mi az a Duchenne-féle izomdisztrófia?
            </h3>
          </div>
          <div className="leading-relaxed text-slate-600">
            <p>
              A DMD egy örökletes betegség, amelyben az izmok fokozatosan károsodnak és gyengülnek.
              Idővel a járás és a mindennapi mozdulatok is egyre nehezebbé válhatnak, és a betegség
              a szív- és légzőizmokat is érintheti.
            </p>
            <p className="mt-4 font-semibold text-[#0B1535]">
              A kezelések célja a folyamat lassítása, a mozgásképesség és az életminőség minél
              hosszabb megőrzése.
            </p>
          </div>
        </div>
        <div className="mt-14 grid items-center gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <figure className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl bg-[#E9E9E9]">
            <Image
              src="/pics/optimized/adi-mindennapok.webp"
              alt="Ádi a zöld kerekesszékében ülve mosolyog és előremutat"
              fill
              sizes="(min-width: 640px) 384px, calc(100vw - 32px)"
              className="object-contain"
            />
          </figure>
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-blue-600 uppercase">
              Ádi mindennapjai
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Sok odafigyelés.
              <br />
              Minden egyes nap.
            </h3>
            <div className="mt-7 space-y-6">
              {[
                {
                  icon: Activity,
                  title: 'Mozgás és gyógytorna',
                  text: 'Rendszeres gyógytorna és gyógymasszázs segíti Ádit. Bokája stabilitását személyre szabott lábmerevítő támogatja; hosszabb távokon kerekesszéket használ.',
                },
                {
                  icon: HeartPulse,
                  title: 'Kezelések és kontrollok',
                  text: 'A betegség lassítására szteroidkezelést kap. Neurológiai, kardiológiai, légzésfunkciós és rehabilitációs vizsgálatok kísérik az állapotát.',
                },
                {
                  icon: Wind,
                  title: 'Éjszakai légzéstámogatás',
                  text: '2024 júliusa óta éjszakai légzéstámogató eszközt használ a légzőizmok gyengesége miatt, a Bethesda Gyermekkórház otthonlélegeztetési programjában.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h4 className="font-bold">{title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-14 grid gap-8 rounded-3xl bg-[#0B1535] p-6 text-white sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-blue-200 uppercase">
              A cél, amiért összefogunk
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Esély egy génterápiás kezelésre.
            </h3>
            <p className="mt-4 leading-relaxed text-slate-300">
              Ádi családja az Elevidys génterápiás kezelésre gyűjt. A kezelés nem jelent biztos
              gyógyulást; alkalmazhatóságát és várható előnyeit a kockázatokkal együtt szakorvosi
              vizsgálat alapján lehet megítélni.
            </p>
            <a
              href="#hogyan-mukodik"
              className="mt-6 inline-flex items-center gap-2 font-bold text-white underline decoration-blue-400 underline-offset-8 hover:text-blue-200"
            >
              Így segíthetsz a palackjaiddal <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="border-t border-white/15 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <p className="text-sm text-blue-200">A család által megadott kezelési költség</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              2,9 millió USD
            </p>
            <p className="mt-2 text-lg text-slate-200">
              A megadott becslés szerint ≈ 1,1 milliárd Ft
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              Járulékos költségek nélkül. A forintösszeg tájékoztató becslés, az árfolyamtól is
              függ.
            </p>
          </div>
        </div>
        <p className="mt-5 max-w-4xl text-xs leading-relaxed text-slate-500">
          Ádi története a család tájékoztatása alapján. A betegségről bővebben:{' '}
          <a
            href="https://www.nhs.uk/conditions/muscular-dystrophy/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-blue-600"
          >
            NHS
          </a>
          . A génterápia alkalmazási feltételeiről és kockázatairól:{' '}
          <a
            href="https://www.fda.gov/vaccines-blood-biologics/tissue-tissue-products/elevidys"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-blue-600"
          >
            FDA – Elevidys
          </a>
          .
        </p>
      </div>
    </section>
  );
}
