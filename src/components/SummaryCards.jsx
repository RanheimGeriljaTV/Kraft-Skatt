import { CalendarDays, Clock, Percent, Wallet } from 'lucide-react';
import { kr, prosent, tall } from '../utils/format.js';

function Nokkelkort({ ikon: Ikon, tittel, verdi, under, children, fremhevet }) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        fremhevet ? 'border-accent/40 bg-accent/[0.08]' : 'border-white/10 bg-brand-navy/80'
      }`}
    >
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-400">
        <Ikon
          size={14}
          aria-hidden="true"
          className={fremhevet ? 'text-accent' : 'text-zinc-500'}
        />
        {tittel}
      </p>
      <p className="mt-2 font-syne text-2xl font-extrabold text-white tabular-nums sm:text-3xl">
        {verdi}
      </p>
      {under && <p className="mt-1 text-sm text-zinc-400 tabular-nums">{under}</p>}
      {children}
    </article>
  );
}

const DELER = [
  { nokkel: 'netto', navn: 'Netto lønn', farge: 'bg-green-500', prikk: 'bg-green-500' },
  { nokkel: 'ferie', navn: 'Feriepenger', farge: 'bg-sky-400', prikk: 'bg-sky-400' },
  {
    nokkel: 'besparelse',
    navn: 'Spart på rentefradrag',
    farge: 'bg-emerald-200',
    prikk: 'bg-emerald-200',
  },
  { nokkel: 'skatt', navn: 'Skatt', farge: 'bg-amber-400', prikk: 'bg-amber-400' },
];

export default function SummaryCards({ resultat }) {
  const { lonn, skatt, netto, trekk, fradrag } = resultat;
  const brutto = lonn.personinntekt;
  const besparelse = fradrag.rentebesparelse;
  const andeler = {
    netto: Math.max(0, netto.aar - lonn.feriepenger - besparelse),
    ferie: lonn.feriepenger,
    besparelse,
    skatt: skatt.total,
  };

  return (
    <section aria-labelledby="resultat-tittel" className="space-y-4">
      <h2 id="resultat-tittel" className="sr-only">
        Resultat
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Nokkelkort
          ikon={Wallet}
          tittel="Netto utbetalt / mnd"
          verdi={kr(netto.vanligMaaned)}
          under={`Brutto ${kr(lonn.maanedslonn)}`}
          fremhevet
        />
        <Nokkelkort
          ikon={CalendarDays}
          tittel="Netto årslønn"
          verdi={kr(netto.aar)}
          under={`Brutto ${kr(brutto)} inkl. feriepenger`}
        />
        <Nokkelkort
          ikon={Clock}
          tittel="Netto timelønn"
          verdi={kr(netto.timelonn)}
          under={`Brutto ${tall(lonn.timelonn, 2)} kr`}
        />
        <Nokkelkort
          ikon={Percent}
          tittel="Skatt og rentefradrag"
          verdi={kr(trekk.vanlig)}
          under={`Trekk per vanlig måned · effektiv skatt ${prosent(skatt.effektiv)}`}
        >
          {besparelse > 0 && (
            <p className="mt-2 text-sm text-emerald-300">
              Rentefradraget sparer deg {kr(besparelse / 12)} i skatt per måned.
            </p>
          )}
        </Nokkelkort>
      </div>

      {brutto > 0 && (
        <figure className="rounded-2xl border border-white/10 bg-brand-navy/80 p-4">
          <figcaption className="mb-3 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
              Fordeling av årsinntekten
            </span>
            <span className="text-sm text-zinc-500 tabular-nums">{kr(brutto)}</span>
          </figcaption>
          <div
            className="flex h-5 w-full overflow-hidden rounded-full bg-zinc-800"
            role="img"
            aria-label={DELER.map(
              (d) => `${d.navn} ${prosent(andeler[d.nokkel] / brutto, 0)}`,
            ).join(', ')}
          >
            {DELER.map((d) =>
              andeler[d.nokkel] > 0 ? (
                <div
                  key={d.nokkel}
                  className={`${d.farge} h-full transition-[width] duration-300 first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${(andeler[d.nokkel] / brutto) * 100}%` }}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {DELER.map((d) => (
              <li key={d.nokkel} className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${d.prikk}`} />
                <span className="truncate text-zinc-300">{d.navn}</span>
                <span className="ml-auto text-zinc-500 tabular-nums">
                  {prosent(andeler[d.nokkel] / brutto, 0)}
                </span>
              </li>
            ))}
          </ul>
        </figure>
      )}
    </section>
  );
}
