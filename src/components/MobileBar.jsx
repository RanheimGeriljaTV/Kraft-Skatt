import { kr, prosent } from '../utils/format.js';

/** Fast linje nederst på mobil, så nøkkeltallene alltid er synlige mens man justerer. */
export default function MobileBar({ resultat }) {
  return (
    <section
      aria-label="Netto utbetalt og effektiv skatt"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-dark/95 px-4 pt-2 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Netto utbetalt / mnd
          </p>
          <p className="font-syne text-xl font-extrabold text-accent tabular-nums">
            {kr(resultat.netto.vanligMaaned)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Effektiv skatt
          </p>
          <p className="font-syne text-xl font-extrabold text-white tabular-nums">
            {prosent(resultat.skatt.effektiv)}
          </p>
        </div>
      </div>
    </section>
  );
}
