// Skatteetatens trekktabeller (tabelltrekk) for 2026, regnet ut etter trekkrutinen i stedet
// for slått opp i en tabellfil. Dermed får vi samme trekk som på lønnsslippen, som er litt
// høyere enn årsskatten delt på 10,5 fordi tabellene bruker lavere minstefradrag (40,48 %,
// maks 84 216 kr) og rundt trekkgrunnlaget.
//
// Tabellnummer:
//   8000–8400  fradrag på (n − 8000) × 1000 kr
//   9010–9400  tillegg på (n − 9000) × 1000 kr
//   7150, 7160, 7170  spesialtabeller uten standardfradrag (se SPESIALTABELLER)
// Andre spesialtabeller (sjøfolk, Finnmark, petroleum) er ikke med.

import { SATSER, TREKKTABELL as T } from './satser.js';

export const SPESIALTABELLER = {
  7150: { navn: '7150 – 12 mnd trekk, ingen fradrag', maaneder: 12, trygd: 'hoy' },
  7160: { navn: '7160 – 12 mnd trekk, uten trygdeavgift', maaneder: 12, trygd: 'ingen' },
  7170: { navn: '7170 – 10,5 mnd trekk, uten trygdeavgift', maaneder: 10.5, trygd: 'ingen' },
};

/** Alle tabellnummer vi støtter, som tekst: 8000–8400, 9010–9400, 7150, 7160 og 7170. */
export function alleTabeller() {
  const liste = [];
  for (let n = 8000; n <= 8400; n += 10) liste.push(String(n));
  for (let n = 9010; n <= 9400; n += 10) liste.push(String(n));
  return liste.concat(Object.keys(SPESIALTABELLER));
}

/**
 * Hva en tabell forutsetter.
 * `fradrag` og `tillegg` er positive beløp i kroner (bare ett av dem er over 0).
 * `trygd` er 'hoy' (7,6 %), 'lav' (5,1 %) eller 'ingen'. `maaneder` er antall trekkmåneder:
 * 10,5 (ikke trekk i juni, halvt trekk i desember) eller 12.
 */
export function tolkTabell(nummer) {
  const n = Number(nummer);
  if (SPESIALTABELLER[n]) {
    return { gyldig: true, vanlig: false, fradrag: 0, tillegg: 0, ...SPESIALTABELLER[n] };
  }
  if (n >= 8000 && n <= 8400 && n % 10 === 0) {
    return {
      gyldig: true,
      vanlig: true,
      fradrag: (n - 8000) * 1000,
      tillegg: 0,
      maaneder: 10.5,
      trygd: 'hoy',
    };
  }
  if (n >= 9010 && n <= 9400 && n % 10 === 0) {
    return {
      gyldig: true,
      vanlig: true,
      fradrag: 0,
      tillegg: (n - 9000) * 1000,
      maaneder: 10.5,
      trygd: 'hoy',
    };
  }
  // Ukjent nummer: regn som 8000, så beregningen aldri stopper.
  return { gyldig: false, vanlig: true, fradrag: 0, tillegg: 0, maaneder: 10.5, trygd: 'hoy' };
}

function trygdeavgift(personinntekt, kategori) {
  const frigrense = SATSER.trygdeavgiftFrigrense;
  if (kategori === 'ingen' || personinntekt <= frigrense) return 0;
  const pst = T.trygdePst[kategori];
  const opptrapping = SATSER.trygdeavgiftOpptrapping * 100; // 25 %
  const innslag = Math.round((frigrense * opptrapping) / (opptrapping - pst));
  return personinntekt > innslag
    ? Math.round((personinntekt * pst) / 100)
    : Math.round(((personinntekt - frigrense) * opptrapping) / 100);
}

function trinnskatt(personinntekt) {
  const trinn = SATSER.trinnskatt;
  let skatt = 0;
  for (let i = 0; i < trinn.length; i++) {
    const [fra, sats] = trinn[i];
    const til = i + 1 < trinn.length ? trinn[i + 1][0] : Infinity;
    if (personinntekt > fra) skatt += (Math.min(personinntekt, til) - fra) * sats;
  }
  return Math.round(skatt); // trinnene summeres først, og rundes én gang
}

/**
 * Skattetrekk for én utbetaling, i hele kroner, slik tabellen gir det.
 * @param {string|number} nummer  tabellnummer
 * @param {number} grunnlag       bruttobeløpet som utbetales denne måneden (trekkgrunnlag)
 */
export function tabelltrekk(nummer, grunnlag) {
  const tabell = tolkTabell(nummer);
  const brutto = Math.max(0, Number(grunnlag) || 0);
  if (brutto === 0) return 0;

  // 1. Grunnlaget rundes ned til hele 100 kr, pluss 50, og gjøres om til årsinntekt.
  const avrundet = Math.floor(brutto / T.avrunding) * T.avrunding + T.avrundingTillegg;
  const faktor = tabell.vanlig ? T.inntektsfaktorVanlig : T.inntektsfaktorAnnen;
  const personinntekt = Math.round(avrundet * faktor);

  // 2. Alminnelig inntekt: minstefradrag, personfradrag og tabellens fradrag eller tillegg.
  const minstefradrag = Math.max(
    0,
    Math.min(
      Math.round((personinntekt * T.minstefradragPst) / 100),
      T.minstefradragMaks,
      personinntekt,
    ),
  );
  const alminnelig =
    personinntekt - minstefradrag - SATSER.personfradrag - tabell.fradrag + tabell.tillegg;

  // 3. Hver skattepost rundes for seg.
  const kommune = alminnelig > 0 ? Math.round((alminnelig * T.kommunePst) / 100) : 0;
  const felles = alminnelig > 0 ? Math.round((alminnelig * T.fellesPst) / 100) : 0;
  const sumSkatt =
    kommune + felles + trinnskatt(personinntekt) + trygdeavgift(personinntekt, tabell.trygd);

  // 4. Årsskatten fordeles på trekkmånedene. Trekket kan ikke være større enn utbetalingen.
  return Math.min(Math.round(sumSkatt / tabell.maaneder), brutto);
}

/**
 * Tabellen (av 8000–8400 og 9010–9400) hvis trekk over året kommer nærmest `malSkatt`.
 * @param {number} malSkatt            skatten trekket skal treffe
 * @param {(nummer: string) => number} aarsTrekk  samlet trekk i året med denne tabellen
 */
export function besteTabell(malSkatt, aarsTrekk) {
  let beste = '8000';
  let minstAvvik = Infinity;
  for (const nummer of alleTabeller()) {
    if (SPESIALTABELLER[nummer]) continue;
    const avvik = Math.abs(aarsTrekk(nummer) - malSkatt);
    if (avvik < minstAvvik) {
      minstAvvik = avvik;
      beste = nummer;
    }
  }
  return beste;
}
