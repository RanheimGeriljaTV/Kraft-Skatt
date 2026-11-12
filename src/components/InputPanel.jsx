import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  HeartHandshake,
  Info,
  Landmark,
  Search,
  Sparkles,
  SunMedium,
} from 'lucide-react';
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
  time: {
    navn: 'Timelønn',
    suffiks: 'kr/t',
    maks: 1_000,
    steg: 5,
    hurtig: [150, 200, 250, 300, 400],
    hint: 'Det du får per time, før skatt. Stillingsprosenten under bestemmer hvor mange timer du jobber.',
  },
  maaned: {
    navn: 'Månedslønn',
    suffiks: 'kr/mnd',
    maks: 200_000,
    steg: 500,
    hurtig: [10_000, 25_000, 40_000, 50_000, 60_000, 75_000],
    hint: 'Det du faktisk får i lønn per måned, før skatt.',
  },
  aar: {
    navn: 'Årslønn',
    suffiks: 'kr/år',
    maks: 2_400_000,
    steg: 5_000,
    hurtig: [150_000, 300_000, 500_000, 600_000, 750_000, 1_000_000],
    hint: 'Det du faktisk får i lønn per år, før skatt og uten feriepenger.',
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

function Infoboks({ farge = 'accent', children }) {
  const stil =
    farge === 'emerald'
      ? 'border-emerald-400/20 bg-emerald-400/[0.06]'
      : farge === 'amber'
        ? 'border-amber-400/25 bg-amber-400/[0.07]'
        : 'border-accent/25 bg-accent/[0.07]';
  return (
    <div className={`rounded-xl border p-3 text-sm leading-relaxed text-zinc-300 ${stil}`}>
      {children}
    </div>
  );
}

export default function InputPanel({ valg, oppdater, resultat }) {
  return (
    <div className="space-y-4">
      <LonnKort valg={valg} oppdater={oppdater} resultat={resultat} />
      <UforeKort valg={valg} oppdater={oppdater} resultat={resultat} />
      <GjeldKort valg={valg} oppdater={oppdater} resultat={resultat} />
      <SkattKort valg={valg} oppdater={oppdater} resultat={resultat} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Steg A: Lønn og arbeidstid
// ---------------------------------------------------------------------------
function LonnKort({ valg, oppdater, resultat }) {
  const basis = BASIS[valg.lonnBasis] ?? BASIS.maaned;
  const [egenStilling, setEgenStilling] = useState(!STILLINGER.includes(valg.stilling));
  const visEgen = egenStilling || !STILLINGER.includes(valg.stilling);
  const { lonn } = resultat;

  const byttBasis = (ny) => {
    if (ny === valg.lonnBasis) return;
    oppdater({
      lonnBasis: ny,
      belop: konverterBelop(valg.belop, valg.lonnBasis, ny, valg.stilling, valg.arbeidsuke),
    });
  };

  return (
    <Kort steg="Steg A" tittel="Lønn og arbeidstid" ikon={Briefcase}>
      <Valg
        etikett="Jeg vet"
        verdi={valg.lonnBasis}
        onChange={byttBasis}
        valg={Object.entries(BASIS).map(([verdi, b]) => ({ verdi, navn: b.navn }))}
      />

      <div className="space-y-3">
        <Tallfelt
          etikett={basis.navn}
          verdi={valg.belop}
          desimaler={valg.lonnBasis === 'time' ? 2 : 0}
          maks={basis.maks * 5}
          suffiks={basis.suffiks}
          onChange={(belop) => oppdater({ belop })}
          hint={basis.hint}
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
            { verdi: 'egen', navn: 'Annen' },
          ]}
        />
        {visEgen && (
          <Tallfelt
            etikett="Din stillingsprosent"
            verdi={valg.stilling}
            maks={100}
            desimaler={1}
            suffiks="%"
            onChange={(stilling) => oppdater({ stilling })}
          />
        )}
        <Hint>
          {Math.round(lonn.timerAar)} timer i året ·{' '}
          {valg.lonnBasis === 'time'
            ? `${kr(lonn.maanedslonn)} i måneden`
            : `timelønn ${tall(lonn.timelonn, 2)} kr`}
        </Hint>
      </div>

      <Valg
        etikett="Arbeidsuke ved 100 %"
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
// Steg B: Uføretrygd (valgfritt)
// ---------------------------------------------------------------------------
const MINSTE_UFORE =
  Math.round((SATSER.uforeMinsteYtelseEnsligG * SATSER.grunnbelopSnitt) / 100) * 100;

function UforeKort({ valg, oppdater, resultat }) {
  const { ufore, lonn } = resultat;

  return (
    <Kort steg="Steg B · valgfritt" tittel="Uføretrygd" ikon={HeartHandshake}>
      <Bryter
        etikett="Jeg mottar uføretrygd fra Nav"
        under="Se hva jobben gir deg etter skatt og redusert uføretrygd"
        pa={valg.ufore}
        onChange={(pa) =>
          oppdater(
            pa ? { ufore: true, uforetrygd: valg.uforetrygd || MINSTE_UFORE } : { ufore: false },
          )
        }
      >
        <Tallfelt
          etikett="Uføretrygd per år før reduksjon"
          verdi={valg.uforetrygd}
          maks={2_000_000}
          suffiks="kr/år"
          onChange={(uforetrygd) => oppdater({ uforetrygd })}
          hint={`Står i vedtaket ditt (brutto, uten barnetillegg). Minste årlige ytelse for enslige er 2,529 G ≈ ${kr(MINSTE_UFORE)}.`}
        />

        <Valg
          etikett="Fribeløp"
          verdi={valg.fribelop}
          onChange={(fribelop) => oppdater({ fribelop })}
          valg={[
            { verdi: '1g', navn: '1 G', under: 'uføretrygd i 2 år+' },
            { verdi: '04g', navn: '0,4 G', under: 'første 24 måneder' },
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <Tallfelt
            etikett="Inntekt etter uførhet"
            verdi={valg.ieu}
            maks={2_000_000}
            suffiks="kr"
            onChange={(ieu) => oppdater({ ieu })}
          />
          <Tallfelt
            etikett="Reduksjons­prosent"
            verdi={valg.reduksjonsprosent}
            maks={SATSER.uforeReduksjonMaks}
            desimaler={1}
            suffiks="%"
            onChange={(reduksjonsprosent) => oppdater({ reduksjonsprosent })}
          />
        </div>
        <Hint>
          Begge står i vedtaket. Inntekt etter uførhet (IEU) er 0 hvis du er 100 % ufør.
          Reduksjonsprosenten (tidligere kompensasjonsgrad) er maks {SATSER.uforeReduksjonMaks} %
          fra 1. juli 2026.
        </Hint>

        <Infoboks farge={ufore.reduksjon > 0 ? 'amber' : 'emerald'}>
          <p>
            Bunnfradrag: <strong className="text-white">{kr(ufore.bunnfradrag)}</strong>{' '}
            {valg.ieu > 0
              ? `(IEU ${kr(valg.ieu)} + fribeløp ${kr(ufore.fribelop)})`
              : `(fribeløp ${valg.fribelop === '1g' ? '1 G' : '0,4 G'})`}
            . Du tjener <strong className="text-white">{kr(lonn.arbeidsinntekt)}</strong> i år inkl.
            feriepenger.
          </p>
          <p className="mt-1.5">
            {ufore.reduksjon > 0 ? (
              <>
                Uføretrygden reduseres med{' '}
                <strong className="text-amber-300">{kr(ufore.reduksjon)}</strong> (
                {tall(ufore.reduksjonsprosent, 1)} % av {kr(ufore.overBunnfradrag)} over
                bunnfradraget).
              </>
            ) : (
              <>
                Uføretrygden reduseres ikke. Du kan tjene{' '}
                <strong className="text-emerald-300">{kr(ufore.igjenFoerReduksjon)}</strong> til i
                år før den blir redusert.
              </>
            )}
          </p>
          <p className="mt-1.5">
            Utbetalt fra Nav: <strong className="text-white">{kr(ufore.utbetalt)}</strong> i året (
            {kr(ufore.maaned)} i måneden, før skatt).
          </p>
        </Infoboks>
      </Bryter>
    </Kort>
  );
}

// ---------------------------------------------------------------------------
// Steg C: Gjeld, renter og fradrag
// ---------------------------------------------------------------------------
function GjeldKort({ valg, oppdater, resultat }) {
  const { fradrag } = resultat;
  const [visFag, setVisFag] = useState(valg.fagforening > 0);
  const [visBsu, setVisBsu] = useState(valg.bsu > 0);
  const [visReise, setVisReise] = useState(valg.reiseKm > 0);
  const smart = valg.skattemodus === 'smart';

  return (
    <Kort steg="Steg C" tittel="Gjeld, renter og fradrag" ikon={Landmark}>
      {!smart && (
        <Infoboks farge="amber">
          <p className="flex gap-2">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span>
              Du bruker {valg.skattemodus === 'tabell' ? 'tabelltrekk' : 'prosenttrekk'}, så
              fradragene endrer ikke det du får utbetalt hver måned. De kommer som penger tilbake
              ved skatteoppgjøret.{' '}
              <button
                type="button"
                onClick={() => oppdater({ skattemodus: 'smart' })}
                className="inline-flex min-h-11 items-center font-semibold text-amber-200 underline underline-offset-4"
              >
                Bytt til «Smart»
              </button>{' '}
              for å se effekten per måned.
            </span>
          </p>
        </Infoboks>
      )}

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

      <Infoboks farge="emerald">
        Årlige renteutgifter: <strong className="text-white">{kr(fradrag.renteutgifter)}</strong>
        <ArrowRight
          size={14}
          className="mx-1 inline align-[-2px] text-emerald-300"
          aria-hidden="true"
        />
        gir deg <strong className="text-emerald-300">{kr(fradrag.rentebesparelse)}</strong> i
        redusert skatt per år ({sats(SATSER.skattAlminnelig)} rentefradrag)
        {fradrag.rentebesparelseMaaned >= 1
          ? `, altså ${kr(fradrag.rentebesparelseMaaned)} mer utbetalt i en vanlig måned.`
          : '.'}
      </Infoboks>

      <div className="space-y-2">
        <p className="font-mono text-[11px] tracking-widest text-zinc-400 uppercase">
          Andre fradrag
        </p>
        <Bryter
          etikett="Fagforeningskontingent"
          under={`Fradrag opptil ${kr(SATSER.fagforeningMaks)} per år`}
          pa={visFag}
          onChange={(pa) => {
            setVisFag(pa);
            oppdater({ fagforening: pa ? valg.fagforening || SATSER.fagforeningMaks : 0 });
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
                : `Gir ${kr(fradrag.fagforening * SATSER.skattAlminnelig)} mindre i skatt per år.`
            }
          />
        </Bryter>

        <Bryter
          etikett="BSU-sparing"
          under={`${sats(SATSER.bsuFradragSats)} skattefradrag, opptil ${kr(SATSER.bsuMaksSparing)} spart per år (til og med året du fyller 33)`}
          pa={visBsu}
          onChange={(pa) => {
            setVisBsu(pa);
            oppdater({ bsu: pa ? valg.bsu || SATSER.bsuMaksSparing : 0 });
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
          under={`${tall(SATSER.reisefradragPerKm, 2)} kr per km, fradrag for det som er over ${kr(SATSER.reisefradragBunn)}`}
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
          <Hint>
            {fradrag.reisefradrag > 0
              ? `Reisekostnad ${kr(fradrag.reisekostnad)} gir ${kr(fradrag.reisefradrag)} i fradrag.`
              : fradrag.reisekostnad > 0
                ? `Reisekostnaden (${kr(fradrag.reisekostnad)}) er under ${kr(SATSER.reisefradragBunn)}, så du får ikke fradrag.`
                : 'Skriv inn avstanden til jobben.'}
          </Hint>
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
// Steg D: Skattemodus og ferieavtale
// ---------------------------------------------------------------------------
function SkattKort({ valg, oppdater, resultat }) {
  const anbefalt = resultat.fradrag.anbefaltTabell;
  const uforeMedLonn = resultat.ufore.aktiv && resultat.lonn.arbeidsinntekt > 0;
  // Riktig bikort-prosent: marginalskatten på lønna når Nav trekker skatten på trygda.
  const anbefaltProsent = Math.ceil(resultat.fradrag.anbefaltBikort * 1000) / 10;

  return (
    <Kort steg="Steg D" tittel="Skattetrekk og ferie" ikon={SunMedium}>
      <Valg
        etikett="Hvordan trekkes skatten?"
        verdi={valg.skattemodus}
        onChange={(skattemodus) => oppdater({ skattemodus })}
        umami="skatt_modus"
        valg={[
          { verdi: 'smart', navn: 'Smart', under: 'riktig trekk' },
          { verdi: 'tabell', navn: 'Tabell', under: 'fra skattekort' },
          { verdi: 'prosent', navn: 'Prosent', under: 'fast trekk' },
        ]}
      />

      {valg.skattemodus === 'smart' && (
        <Infoboks>
          <p className="flex items-center gap-2 font-semibold text-white">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            Trekket som gir null i restskatt
          </p>
          {uforeMedLonn ? (
            <p className="mt-1">
              Nav trekker skatten på uføretrygden, og arbeidsgiveren trekker resten. Det tilsvarer
              omtrent <strong className="text-accent">tabell {anbefalt}</strong> hos Nav og{' '}
              <strong className="text-accent">{tall(anbefaltProsent, 1)} %</strong> prosenttrekk
              (bikort) hos arbeidsgiveren.
            </p>
          ) : (
            <p className="mt-1">
              Regner ut skatten med alle fradragene dine og fordeler den over 10,5 måneder. Det
              tilsvarer omtrent <strong className="text-accent">tabell {anbefalt}</strong>
              {resultat.ufore.aktiv ? ' hos Nav' : ''}.
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              oppdater({
                skattemodus: 'tabell',
                tabellnummer: anbefalt,
                ...(uforeMedLonn ? { prosent: anbefaltProsent } : {}),
              })
            }
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent underline-offset-4 hover:underline"
          >
            Sammenlign med tabell {anbefalt}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </Infoboks>
      )}

      {valg.skattemodus === 'tabell' && (
        <TabellVelger valg={valg} oppdater={oppdater} anbefalt={anbefalt} />
      )}

      {valg.skattemodus === 'tabell' && uforeMedLonn && (
        <Tallfelt
          etikett="Prosenttrekk hos arbeidsgiveren (bikort)"
          verdi={valg.prosent}
          desimaler={1}
          maks={100}
          suffiks="%"
          onChange={(prosent) => oppdater({ prosent })}
          hint={`Tabellen gjelder uføretrygden fra Nav. For at året skal gå i null bør arbeidsgiveren trekke ca. ${tall(anbefaltProsent, 1)} %.`}
        />
      )}

      {valg.skattemodus === 'prosent' && (
        <div className="space-y-3">
          <Tallfelt
            etikett={resultat.ufore.aktiv ? 'Prosenttrekk (Nav og arbeidsgiver)' : 'Prosenttrekk'}
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

      {resultat.ufore.aktiv && (
        <Hint>
          Uføretrygd har ikke feriepenger, men Nav trekker ikke skatt av den i juni og trekker halv
          skatt i desember. Arbeidsgiveren trekker prosent av all lønn hele året.
        </Hint>
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
          className="mb-2 block font-mono text-[11px] tracking-widest text-zinc-400 uppercase"
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
          className="mb-2 block font-mono text-[11px] tracking-widest text-zinc-400 uppercase"
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
