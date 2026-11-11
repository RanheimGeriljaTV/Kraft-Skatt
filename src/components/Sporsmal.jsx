import { SPORSMAL } from '../data/sporsmal.js';

/** «Spørsmål og svar» under kalkulatoren. Samme tekst ligger i FAQPage-JSON-LD. */
export default function Sporsmal() {
  return (
    <section
      aria-labelledby="sporsmal-tittel"
      className="rounded-2xl border border-white/10 bg-brand-navy/80 p-4 sm:p-6"
    >
      <h2 id="sporsmal-tittel" className="font-syne text-xl font-bold text-white">
        Spørsmål og svar
      </h2>
      <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
        {SPORSMAL.map(({ sporsmal, svar }) => (
          <article key={sporsmal}>
            <h3 className="font-semibold text-zinc-100">{sporsmal}</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{svar}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
