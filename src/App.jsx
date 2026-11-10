import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import PrivacyBanner from './components/PrivacyBanner.jsx';
import InputPanel from './components/InputPanel.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import YearlyPayouts from './components/YearlyPayouts.jsx';
import TaxBreakdown from './components/TaxBreakdown.jsx';
import MobileBar from './components/MobileBar.jsx';
import { useLagredeValg } from './hooks/useLagredeValg.js';
import { beregn } from './utils/taxCalculator.js';
import { AAR } from './utils/satser.js';

export default function App() {
  const { valg, oppdater, nullstill, harLagret } = useLagredeValg();
  const resultat = useMemo(() => beregn(valg), [valg]);
  // Ny nøkkel etter nullstilling, så åpne bryterfelt og utkast i skjemaet også nullstilles.
  const [skjemaNokkel, setSkjemaNokkel] = useState(0);

  return (
    <div className="pb-24 lg:pb-0">
      <header className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
        <a
          href="../"
          className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-zinc-400 transition-colors hover:text-accent"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Ranheim Kraft
        </a>
        <div className="mt-2 mb-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
            Kalkulator · skatteåret {AAR}
          </p>
          <h1 className="mt-1 font-syne text-3xl leading-tight font-extrabold text-white sm:text-5xl">
            Lønn, skatt og feriepenger
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Se hva du faktisk får utbetalt hver måned, i juni og i desember, og hvor mye gjelden din
            sparer deg i skatt. Mottar du uføretrygd, ser du også hva jobben gir deg etter skatt og
            reduksjon.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 pb-10 sm:px-6">
        <PrivacyBanner
          harLagret={harLagret}
          onNullstill={() => {
            nullstill();
            setSkjemaNokkel((n) => n + 1);
          }}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[scrollbar-color:var(--color-zinc-700)_transparent] lg:[scrollbar-width:thin]">
              <InputPanel key={skjemaNokkel} valg={valg} oppdater={oppdater} resultat={resultat} />
            </div>
          </div>

          <div className="space-y-5 lg:col-span-7">
            <SummaryCards resultat={resultat} />
            <YearlyPayouts resultat={resultat} />
            <TaxBreakdown resultat={resultat} />
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs leading-relaxed text-zinc-500 sm:px-6">
        <p>
          Beregningen er et estimat basert på skattesatsene for {AAR} for en enslig lønnsmottaker
          bosatt utenfor Finnmark og Nord-Troms. Tabelltrekket er en forenkling av Skatteetatens
          trekktabeller, og arbeidsgiveren din kan beregne ferietrekket litt annerledes.
          Uføreberegningen bruker reglene fra Nav for 2026 (bunnfradrag, fribeløp og
          reduksjonsprosent), men tar ikke med inntektstak, barnetillegg eller etteroppgjør. Bruk
          Skatteetatens og Navs egne tjenester for skattekortet og vedtaket ditt.
        </p>
        <p className="mt-2 font-mono uppercase tracking-widest">Kraft-Skatt v{__APP_VERSION__}</p>
      </footer>

      <MobileBar resultat={resultat} />
    </div>
  );
}
