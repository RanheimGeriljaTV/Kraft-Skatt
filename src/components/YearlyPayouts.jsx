import { CalendarRange, Gift, Sun } from 'lucide-react';
import { kr, prosent, sats } from '../utils/format.js';
import { FERIEAVTALER } from '../utils/satser.js';

function Linje({ navn, belop, type }) {
  const farge =
    type === 'minus' ? 'text-amber-300' : type === 'pluss' ? 'text-sky-300' : 'text-zinc-200';
  const fortegn = type === 'minus' ? '− ' : type === 'pluss' ? '+ ' : '';
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <dt className="text-zinc-400">{navn}</dt>
      <dd className={`shrink-0 tabular-nums ${farge}`}>
        {fortegn}
        {kr(Math.abs(belop))}
      </dd>
    </div>
  );
}

function Utbetaling({ ikon: Ikon, tittel, etikett, farge, netto, children, merknad }) {
  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-black/20 p-4">
      <header className="mb-3 flex items-center gap-2">
        <span className={`grid size-8 place-items-center rounded-lg ${farge}`}>
          <Ikon size={16} aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-syne font-bold text-white">{tittel}</h3>
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">{etikett}</p>
        </div>
      </header>
      <dl className="flex-1 divide-y divide-white/5">{children}</dl>
      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
          Netto utbetalt
        </p>
        <p className="font-syne text-2xl font-extrabold text-white tabular-nums">{kr(netto)}</p>
        {merknad && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{merknad}</p>}
      </div>
    </article>
  );
}

function Forklaring({ trekk, ufore }) {
  if (ufore.aktiv) {
    const tolv = trekk.navMaaneder === 12;
    return (
      <>
        Nav trekker skatt av uføretrygden{' '}
        {tolv
          ? 'i alle 12 måneder (12-månederstabell).'
          : 'i 10,5 måneder: nullskatt i juni og halv skatt i desember.'}{' '}
        {trekk.arbeidsgiverSats > 0 &&
          `Arbeidsgiveren trekker ${prosent(trekk.arbeidsgiverSats)} av all lønn (bikort), også av feriepengene og i desember.`}
      </>
    );
  }
  if (trekk.modus === 'prosent') {
    return `Prosenttrekk på ${prosent(trekk.sats)} trekkes av alt du får utbetalt, også feriepenger og i desember.`;
  }
  if (trekk.tabell?.maaneder === 12) {
    return 'Tabellen din trekker skatt i alle 12 måneder, også i juni og fullt i desember.';
  }
  return 'Skatten trekkes over 10,5 måneder: ikke trekk i juni og halv skatt i desember (arbeidsgiveren kan i stedet velge november).';
}

export default function YearlyPayouts({ resultat }) {
  const { trekk, lonn, innstillinger, oppgjor, ufore } = resultat;
  const ferie = FERIEAVTALER[innstillinger.ferie] ?? FERIEAVTALER.fem;
  const prosentModus = trekk.modus === 'prosent';
  const tolvMnd = ufore.aktiv ? trekk.navMaaneder === 12 : trekk.tabell?.maaneder === 12;
  const timelonnet = innstillinger.lonnstype === 'time';
  const harLonn = lonn.maanedslonn > 0;
  const halvtTrekk = !tolvMnd && (ufore.aktiv || !prosentModus);
  const agSats = ufore.aktiv ? ` (${prosent(trekk.arbeidsgiverSats)})` : '';

  // Trekklinjer: med uføretrygd vises trekket fra Nav og fra arbeidsgiveren hver for seg.
  const trekkLinjer = (lonnTrekk, uforeTrekk, uforeNavn, samlet, samletNavn) =>
    ufore.aktiv ? (
      <>
        {harLonn && <Linje navn={`Skattetrekk lønn${agSats}`} belop={lonnTrekk} type="minus" />}
        <Linje navn={uforeNavn} belop={uforeTrekk} type="minus" />
      </>
    ) : (
      <Linje navn={samletNavn} belop={samlet} type="minus" />
    );

  const juniEtikett = ufore.aktiv
    ? harLonn
      ? 'Feriepenger + nullskatt på trygd'
      : 'Nullskatt på uføretrygden'
    : 'Feriepengemåneden';

  const juniMerknad = !harLonn
    ? tolvMnd
      ? 'Tabellen trekker skatt også i juni.'
      : 'Uføretrygd gir ikke feriepenger. I stedet trekker Nav ikke skatt i juni.'
    : timelonnet
      ? `Som timelønnet får du ikke lønn for ferietimene (${Math.round(lonn.ferietimer)} t). Her er de trukket i juni for å vise hele året samlet.`
      : `Ferietrekk for ${ferie.kort} = ${ferie.virkedager}/26 av månedslønna. Feriepengene er ${sats(ferie.sats + ferie.tilleggOver60)} av fjorårets lønn.${ufore.aktiv && !tolvMnd ? ' Uføretrygd gir ikke feriepenger, men Nav trekker ikke skatt av den i juni.' : ''}`;

  return (
    <section
      aria-labelledby="aarshjul-tittel"
      className="rounded-2xl border border-white/10 bg-brand-navy/80 p-4 sm:p-5"
    >
      <h2 id="aarshjul-tittel" className="font-syne text-lg font-bold text-white">
        Årshjulet – dine utbetalinger gjennom året
      </h2>
      <p className="mt-1 mb-4 text-sm text-zinc-400">
        <Forklaring trekk={trekk} ufore={ufore} />
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <Utbetaling
          ikon={CalendarRange}
          tittel="Vanlig måned"
          etikett="10 måneder i året"
          farge="bg-green-500/15 text-green-400"
          netto={trekk.vanligBrutto - trekk.vanlig}
        >
          {harLonn && <Linje navn="Lønn" belop={lonn.maanedslonn} />}
          {ufore.aktiv && <Linje navn="Uføretrygd (Nav)" belop={ufore.maaned} />}
          {trekkLinjer(
            trekk.vanligDeler?.lonn,
            trekk.vanligDeler?.ufore,
            'Skattetrekk uføretrygd',
            trekk.vanlig,
            'Skattetrekk',
          )}
        </Utbetaling>

        <Utbetaling
          ikon={Sun}
          tittel="Juni"
          etikett={juniEtikett}
          farge="bg-sky-400/15 text-sky-300"
          netto={trekk.juni.netto}
          merknad={juniMerknad}
        >
          {harLonn && (
            <>
              <Linje navn="Lønn" belop={lonn.maanedslonn} />
              <Linje
                navn={timelonnet ? 'Ubetalte ferietimer' : 'Trekk for ferie'}
                belop={lonn.ferietrekk}
                type="minus"
              />
              <Linje navn="Feriepenger" belop={lonn.feriepenger} type="pluss" />
            </>
          )}
          {ufore.aktiv && <Linje navn="Uføretrygd (Nav)" belop={ufore.maaned} />}
          {trekkLinjer(
            trekk.juni.trekkLonn,
            trekk.juni.trekkUfore,
            trekk.juni.trekkUfore > 0
              ? 'Skattetrekk uføretrygd'
              : 'Skatt på uføretrygd (nullskatt)',
            trekk.juni.trekk,
            trekk.juni.trekk > 0 ? 'Skattetrekk' : 'Skattetrekk (trekkfri)',
          )}
        </Utbetaling>

        <Utbetaling
          ikon={Gift}
          tittel="Desember"
          etikett={
            ufore.aktiv
              ? tolvMnd
                ? 'Fullt trekk'
                : 'Halv skatt på uføretrygden'
              : prosentModus || tolvMnd
                ? 'Fullt trekk'
                : 'Halv skatt'
          }
          farge="bg-amber-400/15 text-amber-300"
          netto={trekk.desember.netto}
          merknad={
            halvtTrekk
              ? 'Arbeidsgiveren velger om det halve trekket kommer i november eller desember.'
              : undefined
          }
        >
          {harLonn && <Linje navn="Lønn" belop={lonn.maanedslonn} />}
          {ufore.aktiv && <Linje navn="Uføretrygd (Nav)" belop={ufore.maaned} />}
          {trekkLinjer(
            trekk.desember.trekkLonn,
            trekk.desember.trekkUfore,
            tolvMnd ? 'Skattetrekk uføretrygd' : 'Halvt trekk uføretrygd',
            trekk.desember.trekk,
            prosentModus || tolvMnd ? 'Skattetrekk' : 'Halvt skattetrekk',
          )}
        </Utbetaling>
      </div>

      {Math.abs(oppgjor) >= 500 && (
        <p
          className={`mt-4 rounded-xl border p-3 text-sm leading-relaxed ${
            oppgjor > 0
              ? 'border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-200'
              : 'border-amber-400/30 bg-amber-400/[0.07] text-amber-200'
          }`}
        >
          {oppgjor > 0
            ? `Med dette trekket betaler du ca. ${kr(oppgjor)} for mye i løpet av året. Du får pengene tilbake ved skatteoppgjøret, eller du kan endre skattekortet og få dem utbetalt løpende.`
            : `Med dette trekket betaler du ca. ${kr(-oppgjor)} for lite i løpet av året. Det blir restskatt ved skatteoppgjøret hvis du ikke endrer skattekortet.`}
        </p>
      )}
    </section>
  );
}
