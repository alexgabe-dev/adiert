import Image from 'next/image';
import { ArrowDown, ArrowRight, Heart, School } from 'lucide-react';

interface HeroSectionProps {
  participatingSchoolCount: number;
  dataAvailable: boolean;
}

export function HeroSection({ participatingSchoolCount, dataAvailable }: HeroSectionProps) {
  return (
    <section
      id="rolunk"
      className="relative overflow-hidden bg-[#F7F8FA] pt-[calc(7rem+env(safe-area-inset-top))] pb-12 md:pt-[calc(9rem+env(safe-area-inset-top))] md:pb-20"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" /> Együtt Ádiért
          </div>
          <h1 className="max-w-xl text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl lg:text-[68px]">
            Egy kis segítség.
            <br />
            <span className="text-blue-600">Egy nagy esély.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
            Ő Ádi. Egy mosolygós kisfiú, aki Duchenne-féle izomdisztrófiával él. Családja a
            génterápiás kezelésére gyűjt. Te is melléjük állhatsz — akár a visszaváltott
            palackjaiddal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              id="hero-how-it-works-btn"
              href="#hogyan-mukodik"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Segítek Ádinak <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#adi-tortenete"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 font-semibold transition-colors hover:bg-slate-50"
            >
              Ismerd meg Ádit <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
            <School className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            <p>
              {dataAvailable ? (
                <>
                  <strong className="text-[#0B1535]">
                    {participatingSchoolCount.toLocaleString('hu-HU')} iskola
                  </strong>{' '}
                  az aktív kampányban. Minden palack számít.
                </>
              ) : (
                'Iskolák és családok összefogása. Minden palack számít.'
              )}
            </p>
          </div>
        </div>
        <figure className="relative mx-auto w-full max-w-lg pb-6 lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#E5E5E5] sm:aspect-[5/6]">
            <Image
              src="/pics/optimized/adi-hero.webp"
              alt="Ádi mosolyogva a kamerába néz, és előremutat a kezével"
              fill
              priority
              sizes="(min-width: 1024px) 560px, (min-width: 640px) 512px, calc(100vw - 32px)"
              className="object-cover object-[50%_42%]"
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/55 to-transparent" />
            <div className="absolute right-6 bottom-9 left-6 text-white">
              <p className="text-3xl font-extrabold tracking-tight">Major Ádám</p>
              <p className="mt-1 text-sm text-white/90">11 éves</p>
            </div>
          </div>
          <figcaption className="absolute right-3 bottom-0 max-w-[calc(100%-1.5rem)] flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2.5 shadow-md sm:right-6 sm:-bottom-1 sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4 sm:shadow-lg">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:h-10 sm:w-10">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold sm:text-sm">A palackod is segítség.</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs">
                Sok apró lépés, egy közös cél.
              </p>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
