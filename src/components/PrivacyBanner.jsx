import { RotateCcw, ShieldCheck } from 'lucide-react';

export default function PrivacyBanner({ onNullstill, harLagret }) {
  return (
    <section
      aria-label="Personvern"
      className="flex flex-col gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <p className="text-sm leading-relaxed text-zinc-300">
          <strong className="font-semibold text-emerald-300">100 % privat:</strong> Alle utregninger
          skjer kun i din egen nettleser. Ingen tall om lønn eller gjeld sendes til noen server.
          Dine valg huskes kun lokalt på din egen enhet.
          <span className="mt-1 block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            {harLagret ? 'Valgene dine er lagret på denne enheten' : 'Ingenting er lagret ennå'}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onNullstill}
        data-umami-event="skatt_nullstill"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-emerald-300/60 hover:text-white"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Slett lokale tall / Nullstill
      </button>
    </section>
  );
}
