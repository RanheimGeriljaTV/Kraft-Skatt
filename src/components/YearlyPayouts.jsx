import { CalendarRange, Gift, Sun } from 'lucide-react';
import { kr, prosent } from '../utils/format.js';
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
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">{etikett}</p>
        </div>
      </header>
      <dl className="flex-1 divide-y divide-white/5">{children}</dl>
      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          Netto utbetalt
        </p>
        <p className="font-syne text-2xl font-extrabold text-white tabular-nums">{kr(netto)}</p>
        {merknad && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{merknad}</p>}
      </div>
    </article>
  );
}

export default function YearlyPayouts({ resultat }) {
  const { trekk, lonn, innstillinger, oppgjor } = resultat;
  const ferie = FERIEAVTALER[innstillinger.ferie] ?? FERIEAVTALER.fem;
  const prosentModus = trekk.modus === 'prosent';
  const tolvMnd = trekk.tabell?.maaneder === 12;
  const timelonnet = innstillinger.lonnstype === 'time';

  return (
    <section
      aria-labelledby="aarshjul-tittel"
      className="rounded-2xl border border-white/10 bg-brand-navy/80 p-4 sm:p-5"
    >
      <h2 id="aarshjul-tittel" className="font-syne text-lg font-bold text-white">
        Årshjulet – dine utbetalinger gjennom året
      </h2>
      <p className="mt-1 mb-4 text-sm text-zinc-400">
        {prosentModus
          ? `Prosenttrekk på ${prosent(trekk.sats)} trekkes av alt du får utbetalt, også feriepenger og i desember.`
          : tolvMnd
            ? 'Tabellen din trekker skatt i alle 12 måneder, også i juni og fullt i desember.'
            : 'Skatten trekkes over 10,5 måneder: ikke trekk i juni og halv skatt i desember.'}
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <Utbetaling
          ikon={CalendarRange}
          tittel="Vanlig måned"
          etikett="10 måneder i året"
          farge="bg-green-500/15 text-green-400"
          netto={trekk.desember.lonn - trekk.vanlig}
        >
          <Linje navn="Brutto månedslønn" belop={lonn.maanedslonn} />
          <Linje navn="Skattetrekk" belop={trekk.vanlig} type="minus" />
        </Utbetaling>

        <Utbetaling
          ikon={Sun}
          tittel="Juni"
          etikett="Feriepengemåneden"
          farge="bg-sky-400/15 text-sky-300"
          netto={trekk.juni.netto}
          merknad={
            timelonnet
              ? `Som timelønnet får du ikke lønn for ferietimene (${Math.round(lonn.ferietimer)} t). Her er de trukket i juni for å vise hele året samlet.`
              : `Ferietrekk for ${ferie.kort} = ${ferie.virkedager}/26 av månedslønna. Feriepengene er ${prosent(ferie.sats + ferie.tilleggOver60)} av fjorårets lønn.`
          }
        >
          <Linje navn="Brutto månedslønn" belop={lonn.maanedslonn} />
          <Linje
            navn={timelonnet ? 'Ubetalte ferietimer' : 'Trekk for ferie'}
            belop={lonn.ferietrekk}
            type="minus"
          />
          <Linje navn="Feriepenger" belop={lonn.feriepenger} type="pluss" />
          <Linje
            navn={trekk.juni.trekk > 0 ? 'Skattetrekk' : 'Skattetrekk (trekkfri)'}
            belop={trekk.juni.trekk}
            type="minus"
          />
        </Utbetaling>

        <Utbetaling
          ikon={Gift}
          tittel="Desember"
          etikett={prosentModus || tolvMnd ? 'Fullt trekk' : 'Halv skatt'}
          farge="bg-amber-400/15 text-amber-300"
          netto={trekk.desember.netto}
        >
          <Linje navn="Brutto månedslønn" belop={lonn.maanedslonn} />
          <Linje
            navn={prosentModus || tolvMnd ? 'Skattetrekk' : 'Halvt skattetrekk'}
            belop={trekk.desember.trekk}
            type="minus"
          />
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
