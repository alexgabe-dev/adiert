import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#E8ECF2] pt-14 pb-10 text-[#667085]">
      <div className="safe-content max-w-7xl mx-auto">
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand Wordmark & Mission */}
          <div className="min-[400px]:col-span-2 md:col-span-1 space-y-3">
            <div className="text-lg font-extrabold text-[#0B1535]">
              Ádiért<span className="text-blue-600">.</span>
            </div>
            <p className="text-xs leading-relaxed max-w-xs">
              Iskolák és családok összefogása Ádi kezeléséért. Visszaváltott palackokból valódi
              segítség a MOHU REpont hálózatán keresztül.
            </p>
          </div>

          {/* Column 2: Navigáció */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1535]">Navigáció</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#adi-tortenete"
                  className="inline-flex min-h-11 items-center hover:text-blue-600 transition-colors"
                >
                  Ádi története
                </a>
              </li>
              <li>
                <a
                  href="#hogyan-mukodik"
                  className="inline-flex min-h-11 items-center hover:text-blue-600 transition-colors"
                >
                  Hogyan működik?
                </a>
              </li>
              <li>
                <a
                  href="#ranglista"
                  className="inline-flex min-h-11 items-center hover:text-blue-600 transition-colors"
                >
                  Ranglista
                </a>
              </li>
              <li>
                <a
                  href="#iskolaknak"
                  className="inline-flex min-h-11 items-center hover:text-blue-600 transition-colors"
                >
                  Iskoláknak
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Információ */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1535]">
              Információ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#gyik"
                  className="inline-flex min-h-11 items-center hover:text-blue-600 transition-colors"
                >
                  GYIK
                </a>
              </li>
              <li>
                <a
                  href="/tanar/belepes"
                  className="inline-flex min-h-11 items-center hover:text-blue-600 transition-colors"
                >
                  Tanári belépés
                </a>
              </li>
              <li>
                <a
                  href="/tanar/regisztracio"
                  className="inline-flex min-h-11 items-center hover:text-blue-600 transition-colors"
                >
                  Iskolai regisztráció
                </a>
              </li>
              <li>
                <a
                  href="/admin/login"
                  className="inline-flex min-h-11 items-center hover:text-blue-600 transition-colors"
                >
                  Szervezői belépés
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Kapcsolat */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1535]">Kapcsolat</h4>
            <p className="text-xs">Kérdésed vagy észrevételed van?</p>
            <a
              href="mailto:info@palackverseny.hu"
              className="inline-flex min-h-11 items-center text-xs font-bold text-blue-600 hover:underline"
            >
              info@palackverseny.hu
            </a>
            <div className="text-[11px] text-slate-400">Budapest, Magyarország</div>
          </div>
        </div>

        {/* Bottom copyright and motto */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>© 2026 Ádiért Alapítvány. Minden jog fenntartva.</div>
          <div className="flex items-center gap-1.5 font-medium text-[#0B1535]">
            <span>Minden palack számít.</span>
            <span className="text-blue-600">💙</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
