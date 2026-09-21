import { RETURN_METHODS } from '@/data/returnProcess';

export function ReturnMethods({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
        <p className="font-bold">Fontos: automatától függően kétféle sorrend lehetséges.</p>
        <p className="mt-2">
          Az első visszaváltás előtt ellenőrizd, melyik módszerrel működik az automatád. Gyűjtsetek
          össze legalább <strong>50 darabot</strong>, és csak utána induljatok visszaváltani.
        </p>
      </div>
      <div className={compact ? 'space-y-6' : 'grid gap-6 lg:grid-cols-2'}>
        {RETURN_METHODS.map((method) => (
          <article
            key={method.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
          >
            <h3 className="text-xl font-extrabold text-[#0B1535]">{method.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{method.subtitle}</p>
            <ol className="mt-6 space-y-5">
              {method.steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold">{step.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-blue-50 p-5 text-sm leading-relaxed text-blue-950">
        <p>
          <strong>Minden alkalommal ellenőrizd a „Szia Alapítvány” feliratot!</strong> A megfelelő
          QR-kódot a visszaváltás során kell beolvasni. Utólag már nem lehet a lezárt visszaváltást
          Ádi célzott adományává alakítani és a versenybe beszámítani.
        </p>
        <p className="mt-2">
          A feltöltéshez az <strong>automata képernyőjéről készült fotóra</strong> van szükség,
          amelyen olvasható a visszaváltott mennyiség.
        </p>
      </div>
    </div>
  );
}
