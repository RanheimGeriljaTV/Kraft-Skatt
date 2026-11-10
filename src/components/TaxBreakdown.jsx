import { ChevronDown } from 'lucide-react';
import { kr, sats } from '../utils/format.js';
import { AAR, SATSER } from '../utils/satser.js';

function Rad({ navn, belop, sterk }) {
  return (
    <div className={`flex justify-between gap-3 py-1.5 ${sterk ? 'font-semibold text-white' : ''}`}>
      <dt className={sterk ? '' : 'text-zinc-400'}>{navn}</dt>
      <dd className="shrink-0 tabular-nums">{kr(belop)}</dd>
    </div>
  );
}

export default function TaxBreakdown({ resultat }) {
  const { lonn, skatt, fradrag, ufore } = resultat;
  const andre = fradrag.fagforening + fradrag.reisefradrag;

  return (
    <details className="group rounded-2xl border border-white/10 bg-brand-navy/80">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-zinc-100 sm:px-5">
        Slik er skatten regnet ut ({AAR})
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="grid gap-6 border-t border-white/10 px-4 py-4 text-sm sm:grid-cols-2 sm:px-5">
        <dl className="divide-y divide-white/5">
          <Rad navn="Lønn (etter ferietrekk)" belop={lonn.feriepengegrunnlag} />
          <Rad navn="Feriepenger" belop={lonn.feriepenger} />
          {ufore.aktiv && <Rad navn="Uføretrygd etter reduksjon" belop={ufore.utbetalt} />}
          <Rad navn="Personinntekt" belop={lonn.personinntekt} sterk />
          <Rad
            navn={`− Minstefradrag (${sats(SATSER.minstefradragSats)})`}
            belop={skatt.minstefradrag}
          />
          <Rad navn="− Personfradrag" belop={SATSER.personfradrag} />
          <Rad navn="− Renteutgifter" belop={fradrag.renteutgifter} />
          {andre > 0 && <Rad navn="− Fagforening og reise" belop={andre} />}
          <Rad navn="Alminnelig inntekt" belop={Math.max(0, skatt.alminneligInntekt)} sterk />
        </dl>
        <dl className="divide-y divide-white/5">
          <Rad
            navn={`Skatt på alminnelig inntekt (${sats(SATSER.skattAlminnelig)})`}
            belop={skatt.skattAlminnelig}
          />
          <Rad
            navn={`Trygdeavgift (${sats(SATSER.trygdeavgiftSats)})`}
            belop={skatt.trygdeavgift}
          />
          <Rad navn="Trinnskatt" belop={skatt.trinnskatt} />
          {skatt.formuesskatt > 0 && <Rad navn="Formuesskatt" belop={skatt.formuesskatt} />}
          {skatt.bsuFradrag > 0 && <Rad navn="− BSU-fradrag" belop={skatt.bsuFradrag} />}
          <Rad navn="Skatt for året" belop={skatt.total} sterk />
          <Rad navn="Spart på alle fradrag" belop={fradrag.fradragsbesparelse} />
        </dl>
      </div>
    </details>
  );
}
