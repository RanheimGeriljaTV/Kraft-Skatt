import { useMemo, useState } from 'react';
import { ArrowRight, Briefcase, Landmark, Search, Sparkles, SunMedium } from 'lucide-react';
import { Bryter, Glider, Hint, Hurtigknapper, Kort, Tallfelt, Valg } from './ui.jsx';
import { kr, sats, tall } from '../utils/format.js';
import {
  alleTabeller,
  konverterBelop,
  tolkTabell,
  SPESIALTABELLER,
} from '../utils/taxCalculator.js';
import { FERIEAVTALER, SATSER } from '../utils/satser.js';

const BASIS = {
  time: { navn: 'Timelønn', suffiks: 'kr/t', maks: 1_000, steg: 5, hurtig: [200, 250, 300, 400] },
  maaned: {
    navn: 'Månedslønn',
    suffiks: 'kr/mnd',
    maks: 200_000,
    steg: 500,
    hurtig: [40_000, 50_000, 60_000, 75_000],
  },
  aar: {
    navn: 'Årslønn',
    suffiks: 'kr/år',
    maks: 2_400_000,
    steg: 5_000,
    hurtig: [500_000, 600_000, 750_000, 1_000_000],
  },
};

const STILLINGER = [100, 80, 50];

function tabellBeskrivelse(nummer) {
  const t = tolkTabell(nummer);
  if (SPESIALTABELLER[nummer]) return SPESIALTABELLER[nummer].navn;
  if (t.tillegg) return `${nummer} – ${kr(t.tillegg)} tillegg`;
  if (t.fradrag) return `${nummer} – ${kr(t.fradrag)} fradrag`;
  return `${nummer} – ingen ekstra fradrag`;
}

export default function InputPanel({ valg, oppdater, resultat }) {
  return (
    <div className="space-y-4">
      <LonnKort valg={valg} oppdater={oppdater} />
      <GjeldKort valg={valg} oppdater={oppdater} resultat={resultat} />
      <SkattKort valg={valg} oppdater={oppdater} resultat={resultat} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kort A: Lønn og arbeidstid
// ---------------------------------------------------------------------------
function LonnKort({ valg, oppdater }) {
  const basis = BASIS[valg.lonnBasis] ?? BASIS.maaned;
  const [egenStilling, setEgenStilling] = useState(!STILLINGER.includes(valg.stilling));
  const visEgen = egenStilling || !STILLINGER.includes(valg.stilling);

  const byttBasis = (ny) => {
    if (ny === valg.lonnBasis) return;
    oppdater({
      lonnBasis: ny,
      belop: konverterBelop(valg.belop, valg.lonnBasis, ny, valg.arbeidsuke),
    });
  };

  return (
    <Kort steg="Steg A" tittel="Lønn og arbeidstid" ikon={Briefcase}>
      <Valg
        etikett="Utgangspunkt"
        verdi={valg.lonnBasis}
        onChange={byttBasis}
        valg={Object.entries(BASIS).map(([verdi, b]) => ({ verdi, navn: b.navn }))}
      />

      <div className="space-y-3">
        <Tallfelt
          etikett={`${basis.navn} (ved 100 % stilling)`}
          verdi={valg.belop}
          desimaler={valg.lonnBasis === 'time' ? 2 : 0}
          maks={basis.maks * 5}
          suffiks={basis.suffiks}
          onChange={(belop) => oppdater({ belop })}
        />
        <Hurtigknapper
          verdier={basis.hurtig}
          aktiv={valg.belop}
          onVelg={(belop) => oppdater({ belop })}
          format={(v) => (v >= 100_000 ? `${tall(v / 1000)}k` : tall(v))}
        />
        <Glider
          etikett={`${basis.navn}, glider`}
          verdi={valg.belop}
          min={0}
          maks={basis.maks}
          steg={basis.steg}
          onChange={(belop) => oppdater({ belop })}
        />
      </div>

      <div className="space-y-3">
        <Valg
          etikett="Stillingsprosent"
          verdi={visEgen ? 'egen' : valg.stilling}
          kolonner={4}
          onChange={(v) => {
            if (v === 'egen') {
              setEgenStilling(true);
            } else {
              setEgenStilling(false);
              oppdater({ stilling: v });
            }
          }}
          valg={[
            ...STILLINGER.map((s) => ({ verdi: s, navn: `${s} %` })),
            { verdi: 'egen', navn: 'Egen' },
          ]}
        />
        {visEgen && (
          <Tallfelt
            etikett="Egendefinert stilling"
            verdi={valg.stilling}
            maks={100}
            desimaler={1}
            suffiks="%"
            onChange={(stilling) => oppdater({ stilling })}
          />
        )}
      </div>

      <Valg
        etikett="Arbeidsuke"
        verdi={valg.arbeidsuke}
        onChange={(arbeidsuke) => oppdater({ arbeidsuke })}
        valg={[
          { verdi: '37.5', navn: '37,5 t/uke', under: '1950 t/år' },
          { verdi: '35.5', navn: '35,5 t/uke', under: '1846 t/år' },
        ]}
      />

      <Valg
        etikett="Lønnstype"
        verdi={valg.lonnstype}
        onChange={(lonnstype) => oppdater({ lonnstype })}
        valg={[
          { verdi: 'fast', navn: 'Fastlønn', under: 'inkl. betalt ferie' },
          { verdi: 'time', navn: 'Timelønnet', under: 'kun faktiske timer' },
        ]}
      />
    </Kort>
  );
}

// ---------------------------------------------------------------------------
// Kort B: Gjeld, renter og fradrag
// ---------------------------------------------------------------------------
function GjeldKort({ valg, oppdater, resultat }) {
  const { fradrag } = resultat;
  const [visFag, setVisFag] = useState(valg.fagforening > 0);
  const [visBsu, setVisBsu] = useState(valg.bsu > 0);
  const [visReise, setVisReise] = useState(valg.reiseKm > 0);

  return (
    <Kort steg="Steg B" tittel="Gjeld, renter og fradrag" ikon={Landmark}>
      <div className="space-y-3">
        <Tallfelt
          etikett="Total gjeld (boliglån, studielån, billån)"
          verdi={valg.gjeld}
          maks={100_000_000}
          suffiks="kr"
          onChange={(gjeld) => oppdater({ gjeld })}
        />
        <Glider
          etikett="Total gjeld, glider"
          verdi={valg.gjeld}
          min={0}
          maks={10_000_000}
          steg={50_000}
          onChange={(gjeld) => oppdater({ gjeld })}
        />
      </div>

      <div className="space-y-3">
        <Tallfelt
          etikett="Gjennomsnittlig rente"
          verdi={valg.rente}
          desimaler={2}
          maks={30}
          suffiks="%"
          onChange={(rente) => oppdater({ rente })}
        />
        <Glider
          etikett="Rente, glider"
          verdi={valg.rente}
          min={0}
          maks={10}
          steg={0.1}
          onChange={(rente) => oppdater({ rente: Math.round(rente * 10) / 10 })}
        />
      </div>

      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-sm leading-relaxed text-zinc-300">
        Årlige renteutgifter: <strong className="text-white">{kr(fradrag.renteutgifter)}</strong>
        <ArrowRight
          size={14}
          className="mx-1 inline align-[-2px] text-emerald-300"
          aria-hidden="true"
        />
        gir deg <strong className="text-emerald-300">{kr(fradrag.rentebesparelse)}</strong> i
        redusert skatt per år ({sats(SATSER.skattAlminnelig)} rentefradrag).
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
          Andre fradrag
        </p>
        <Bryter
          etikett="Fagforeningskontingent"
          under={`Fradrag opptil ${kr(SATSER.fagforeningMaks)} per år`}
          pa={visFag}
          onChange={(pa) => {
            setVisFag(pa);
            if (!pa) oppdater({ fagforening: 0 });
          }}
        >
          <Tallfelt
            etikett="Betalt kontingent per år"
            verdi={valg.fagforening}
            maks={100_000}
            suffiks="kr/år"
            onChange={(fagforening) => oppdater({ fagforening })}
            hint={
              valg.fagforening > SATSER.fagforeningMaks
                ? `Bare ${kr(SATSER.fagforeningMaks)} gir fradrag.`
                : undefined
            }
          />
        </Bryter>

        <Bryter
          etikett="BSU-sparing"
          under={`${sats(SATSER.bsuFradragSats)} skattefradrag, opptil ${kr(SATSER.bsuMaksSparing)} spart per år (til og med året du fyller 33)`}
          pa={visBsu}
          onChange={(pa) => {
            setVisBsu(pa);
            if (!pa) oppdater({ bsu: 0 });
          }}
        >
          <Tallfelt
            etikett="Spart i BSU i år"
            verdi={valg.bsu}
            maks={SATSER.bsuMaksSparing}
            suffiks="kr/år"
            onChange={(bsu) => oppdater({ bsu })}
            hint={`Gir ${kr(fradrag.bsuFradrag)} mindre i skatt.`}
          />
        </Bryter>

        <Bryter
          etikett="Reisefradrag / pendling"
          under={`${tall(SATSER.reisefradragPerKm, 2)} kr per km over ${kr(SATSER.reisefradragBunn)}`}
          pa={visReise}
          onChange={(pa) => {
            setVisReise(pa);
            if (!pa) oppdater({ reiseKm: 0 });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Tallfelt
              etikett="Km tur/retur per dag"
              verdi={valg.reiseKm}
              maks={2_000}
              suffiks="km"
              onChange={(reiseKm) => oppdater({ reiseKm })}
            />
            <Tallfelt
              etikett="Arbeidsdager"
              verdi={valg.reiseDager}
              maks={366}
              suffiks="dager"
              onChange={(reiseDager) => oppdater({ reiseDager })}
            />
          </div>
          <Hint>Reisefradrag: {kr(fradrag.reisefradrag)} per år.</Hint>
        </Bryter>
      </div>

      <Tallfelt
        etikett="Netto formue (valgfritt)"
        verdi={valg.formue}
        maks={10_000_000_000}
        suffiks="kr"
        onChange={(formue) => oppdater({ formue })}
        hint={`Formue minus gjeld, etter verdsettelsesrabatter. Formuesskatt (${sats(SATSER.formuesskattSats)}) betales av det som er over ${kr(SATSER.formuesskattInnslag)}.`}
      />
    </Kort>
  );
}

// ---------------------------------------------------------------------------
// Kort C: Skattemodus og ferieavtale
// ---------------------------------------------------------------------------
function SkattKort({ valg, oppdater, resultat }) {
  const anbefalt = resultat.fradrag.anbefaltTabell;

  return (
    <Kort steg="Steg C" tittel="Skattemodus og ferieavtale" ikon={SunMedium}>
      <Valg
        etikett="Skattetrekk"
        verdi={valg.skattemodus}
        onChange={(skattemodus) => oppdater({ skattemodus })}
        umami="skatt_modus"
        valg={[
          { verdi: 'smart', navn: 'Smart', under: 'inkl. fradrag' },
          { verdi: 'tabell', navn: 'Tabell', under: 'trekkode' },
          { verdi: 'prosent', navn: 'Prosent', under: 'fast trekk' },
        ]}
      />

      {valg.skattemodus === 'smart' && (
        <div className="rounded-xl border border-accent/25 bg-accent/[0.07] p-3 text-sm leading-relaxed text-zinc-300">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            Nøyaktig skatt med dine fradrag
          </p>
          <p className="mt-1">
            Basert på gjeldsrentene og fradragene dine tilsvarer dette omtrent{' '}
            <strong className="text-accent">tabell {anbefalt}</strong>.
          </p>
          <button
            type="button"
            onClick={() => oppdater({ skattemodus: 'tabell', tabellnummer: anbefalt })}
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent underline-offset-4 hover:underline"
          >
            Sammenlign med tabell {anbefalt}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {valg.skattemodus === 'tabell' && (
        <TabellVelger valg={valg} oppdater={oppdater} anbefalt={anbefalt} />
      )}

      {valg.skattemodus === 'prosent' && (
        <div className="space-y-3">
          <Tallfelt
            etikett="Prosenttrekk"
            verdi={valg.prosent}
            desimaler={1}
            maks={100}
            suffiks="%"
            onChange={(prosent) => oppdater({ prosent, frikort: false })}
          />
          <Glider
            etikett="Prosenttrekk, glider"
            verdi={valg.prosent}
            min={0}
            maks={50}
            steg={1}
            onChange={(prosent) => oppdater({ prosent, frikort: false })}
          />
          <Bryter
            etikett="Frikort"
            under={`Ingen skatt opptil ${kr(SATSER.frikortGrense)} i året, deretter 50 % trekk`}
            pa={valg.frikort}
            onChange={(frikort) => oppdater({ frikort })}
          />
        </div>
      )}

      <Valg
        etikett="Ferieavtale"
        verdi={valg.ferie}
        kolonner={3}
        onChange={(ferie) => oppdater({ ferie })}
        valg={[
          { verdi: 'fem', navn: '5 uker', under: '12 % – vanligst' },
          { verdi: 'lov', navn: '4 uker + 1 dag', under: '10,2 %' },
          { verdi: 'over60', navn: 'Over 60 år', under: '+2,3 %' },
        ]}
      />
      <Hint>{FERIEAVTALER[valg.ferie]?.navn}. Feriepengene utbetales i juni.</Hint>
    </Kort>
  );
}

function TabellVelger({ valg, oppdater, anbefalt }) {
  const [sok, setSok] = useState('');
  const tabeller = useMemo(() => alleTabeller(), []);
  const treff = useMemo(() => {
    const s = sok.trim();
    const liste = s ? tabeller.filter((t) => t.startsWith(s)) : tabeller;
    return liste.includes(valg.tabellnummer) ? liste : [valg.tabellnummer, ...liste];
  }, [sok, tabeller, valg.tabellnummer]);
  const tolket = tolkTabell(valg.tabellnummer);

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="tabellsok"
          className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-zinc-400"
        >
          Søk etter tabellnummer
        </label>
        <div className="flex min-h-12 items-center rounded-xl border border-white/10 bg-black/30 focus-within:border-accent">
          <Search size={16} className="ml-3 shrink-0 text-zinc-500" aria-hidden="true" />
          <input
            id="tabellsok"
            type="text"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder="f.eks. 8050"
            value={sok}
            onChange={(e) => {
              const s = e.target.value.replace(/\D/g, '').slice(0, 4);
              setSok(s);
              if (s.length === 4 && tolkTabell(s).gyldig) oppdater({ tabellnummer: s });
            }}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-white outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="tabellvalg"
          className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-zinc-400"
        >
          Tabellnummer fra skattekortet
        </label>
        <select
          id="tabellvalg"
          value={valg.tabellnummer}
          onChange={(e) => oppdater({ tabellnummer: e.target.value })}
          className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-base text-white focus:border-accent focus:outline-none"
        >
          {treff.map((t) => (
            <option key={t} value={t} className="bg-brand-navy">
              {tabellBeskrivelse(t)}
            </option>
          ))}
        </select>
        <Hint>
          {tolket.gyldig
            ? 'Fra 2025 heter tabellene 8000–8400 (fradrag) og 9010–9400 (tillegg). De tre siste sifrene er tusen kroner: 8050 = 50 000 kr i fradrag.'
            : 'Ukjent tabellnummer.'}
        </Hint>
      </div>

      {anbefalt !== valg.tabellnummer && (
        <button
          type="button"
          onClick={() => oppdater({ tabellnummer: anbefalt })}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
        >
          Bruk anbefalt tabell for deg: {anbefalt}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
