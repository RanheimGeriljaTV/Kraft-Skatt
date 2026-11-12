import { useId, useRef, useState } from 'react';
import { tall, tolkInput } from '../utils/format.js';

export function Kort({ tittel, steg, ikon: Ikon, children, className = '' }) {
  const tittelId = useId();
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-brand-navy/80 p-4 sm:p-5 ${className}`}
      aria-labelledby={tittel ? tittelId : undefined}
    >
      {tittel && (
        <header className="mb-4 flex items-center gap-3">
          {Ikon && (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
              <Ikon size={18} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            {steg && (
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                {steg}
              </p>
            )}
            <h2 id={tittelId} className="font-syne text-lg font-bold text-white">
              {tittel}
            </h2>
          </div>
        </header>
      )}
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Etikett({ children, htmlFor, id }) {
  return (
    <label
      htmlFor={htmlFor}
      id={id}
      className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-zinc-400"
    >
      {children}
    </label>
  );
}

export function Hint({ children }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{children}</p>;
}

/** Faner / segmentert valg. */
export function Valg({ etikett, verdi, valg, onChange, kolonner, umami }) {
  const id = useId();
  const knapper = useRef([]);
  // Som i WAI-ARIA-mønsteret for radiogrupper: bare valgt valg er et tab-stopp, og piltastene
  // flytter fokus og valg. Er ingenting valgt, er første valg tab-stoppet.
  const valgtIndeks = valg.findIndex((v) => v.verdi === verdi);
  const tabIndeks = valgtIndeks >= 0 ? valgtIndeks : 0;

  const flyttMedTaster = (e, fra) => {
    const sist = valg.length - 1;
    let til;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') til = fra === sist ? 0 : fra + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') til = fra === 0 ? sist : fra - 1;
    else if (e.key === 'Home') til = 0;
    else if (e.key === 'End') til = sist;
    else return;
    e.preventDefault();
    onChange(valg[til].verdi);
    knapper.current[til]?.focus();
  };

  return (
    <div>
      {etikett && <Etikett id={id}>{etikett}</Etikett>}
      <div
        role="radiogroup"
        aria-labelledby={etikett ? id : undefined}
        className="grid gap-1 rounded-xl bg-black/30 p-1"
        style={{ gridTemplateColumns: `repeat(${kolonner ?? valg.length}, minmax(0, 1fr))` }}
      >
        {valg.map((v, indeks) => {
          const aktiv = v.verdi === verdi;
          return (
            <button
              key={v.verdi}
              ref={(el) => {
                knapper.current[indeks] = el;
              }}
              type="button"
              role="radio"
              aria-checked={aktiv}
              tabIndex={indeks === tabIndeks ? 0 : -1}
              onClick={() => onChange(v.verdi)}
              onKeyDown={(e) => flyttMedTaster(e, indeks)}
              data-umami-event={umami ? `${umami}_${v.verdi}` : undefined}
              className={`min-h-11 rounded-lg px-2 py-1.5 text-center text-sm leading-tight font-semibold transition-colors ${
                aktiv
                  ? 'bg-accent text-brand-dark shadow'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {v.navn}
              {v.under && (
                <span
                  className={`block text-[11px] font-normal ${aktiv ? 'text-brand-dark/75' : 'text-zinc-400'}`}
                >
                  {v.under}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tallfelt med norsk formatering. Viser «650 000» når feltet ikke er i fokus,
 * og lar brukeren skrive fritt mens det er i fokus.
 */
export function Tallfelt({
  etikett,
  verdi,
  onChange,
  suffiks,
  desimaler = 0,
  min = 0,
  maks = Infinity,
  hint,
}) {
  const id = useId();
  const meldingId = useId();
  const [utkast, setUtkast] = useState(null);
  // { feil: boolean, tekst: string } – vises under feltet, også etter at fokus er flyttet.
  const [melding, setMelding] = useState(null);
  const vist = utkast ?? tall(verdi, desimaler);
  const enhet = suffiks ? ` ${suffiks}` : '';

  const settVerdi = (tekst) => {
    setUtkast(tekst);
    const r = tolkInput(tekst, { desimaler });
    if (r.tom) {
      setMelding(null);
      onChange(min);
    } else if (r.feil) {
      // Ugyldig tekst: behold forrige verdi, men si tydelig fra om det.
      setMelding({ feil: true, tekst: r.feil });
    } else {
      const klemt = Math.min(maks, Math.max(min, r.verdi));
      setMelding(
        klemt === r.verdi
          ? null
          : {
              feil: false,
              tekst:
                r.verdi > maks
                  ? `Høyeste verdi er ${tall(maks, desimaler)}${enhet}.`
                  : `Laveste verdi er ${tall(min, desimaler)}${enhet}.`,
            },
      );
      onChange(klemt);
    }
  };

  return (
    <div>
      {etikett && <Etikett htmlFor={id}>{etikett}</Etikett>}
      <div
        className={`flex min-h-12 items-center rounded-xl border bg-black/30 focus-within:border-accent ${
          melding?.feil ? 'border-amber-400/70' : 'border-white/10'
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode={desimaler > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          value={vist}
          aria-invalid={melding?.feil ? true : undefined}
          aria-describedby={meldingId}
          onChange={(e) => settVerdi(e.target.value)}
          onFocus={(e) => {
            setMelding(null);
            setUtkast(verdi === 0 ? '' : tall(verdi, desimaler).replace(/\s/g, ''));
            requestAnimationFrame(() => e.target.select());
          }}
          onBlur={() => setUtkast(null)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-lg font-semibold text-white tabular-nums outline-none"
        />
        {suffiks && <span className="shrink-0 pr-3 text-sm text-zinc-400">{suffiks}</span>}
      </div>
      <div id={meldingId} role="status">
        {melding && (
          <p
            className={`mt-1.5 text-xs leading-relaxed ${melding.feil ? 'text-amber-300' : 'text-zinc-300'}`}
          >
            {melding.tekst}
            {melding.feil && ` Beregningen bruker fortsatt ${tall(verdi, desimaler)}${enhet}.`}
          </p>
        )}
      </div>
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function Glider({ etikett, verdi, onChange, min, maks, steg = 1 }) {
  return (
    <input
      type="range"
      aria-label={etikett}
      min={min}
      max={maks}
      step={steg}
      value={Math.min(maks, Math.max(min, verdi))}
      onChange={(e) => onChange(Number(e.target.value))}
      className="glider w-full"
    />
  );
}

export function Bryter({ etikett, under, pa, onChange, children }) {
  const id = useId();
  return (
    <div className="rounded-xl border border-white/10 bg-black/20">
      <button
        type="button"
        role="switch"
        aria-checked={pa}
        aria-controls={pa && children ? id : undefined}
        onClick={() => onChange(!pa)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-zinc-100">{etikett}</span>
          {under && <span className="block text-xs text-zinc-400">{under}</span>}
        </span>
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${pa ? 'bg-accent' : 'bg-zinc-700'}`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${pa ? 'translate-x-5.5' : 'translate-x-0.5'}`}
          />
        </span>
      </button>
      {pa && children && (
        <div id={id} className="space-y-4 border-t border-white/10 px-3 pt-3 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function Hurtigknapper({ verdier, aktiv, onVelg, format }) {
  return (
    <div className="flex flex-wrap gap-2">
      {verdier.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onVelg(v)}
          aria-pressed={aktiv === v}
          className={`min-h-11 rounded-full border px-3.5 text-sm font-semibold tabular-nums transition-colors ${
            aktiv === v
              ? 'border-accent bg-accent/15 text-accent'
              : 'border-white/10 text-zinc-300 hover:border-white/30 hover:text-white'
          }`}
        >
          {format(v)}
        </button>
      ))}
    </div>
  );
}
