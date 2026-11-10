// Ren beregningsmotor for lønn, skatt, gjeld og feriepenger.
// Ingen avhengigheter til React eller nettleseren, så alt kan testes isolert.

import { ARBEIDSUKER, FERIEAVTALER, SATSER } from './satser.js';

export const STANDARDVALG = {
  lonnBasis: 'maaned', // 'time' | 'maaned' | 'aar'
  belop: 50_000, // fulltidsbeløp (100 %) i valgt basis
  stilling: 100, // prosent
  arbeidsuke: '37.5',
  lonnstype: 'fast', // 'fast' | 'time'
  gjeld: 0,
  rente: 5.5, // prosent
  fagforening: 0, // kr per år
  bsu: 0, // kr spart per år
  reiseKm: 0, // km tur/retur per arbeidsdag
  reiseDager: 220,
  formue: 0, // netto formue (formue minus gjeld)
  skattemodus: 'smart', // 'smart' | 'tabell' | 'prosent'
  tabellnummer: '8000',
  prosent: 30,
  frikort: false,
  ferie: 'fem',
};

const tall = (v, min = 0, maks = Infinity) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(maks, Math.max(min, n));
};

// ---------------------------------------------------------------------------
// Lønn
// ---------------------------------------------------------------------------

/** Fulltids årslønn (100 %) fra beløpet i valgt basis. */
export function fulltidsAarslonn(belop, basis, arbeidsuke = '37.5') {
  const { timerAar } = ARBEIDSUKER[arbeidsuke] ?? ARBEIDSUKER['37.5'];
  const b = tall(belop);
  if (basis === 'time') return b * timerAar;
  if (basis === 'aar') return b;
  return b * 12;
}

/** Gjør om et fulltidsbeløp fra én basis til en annen (brukes når fanen byttes). */
export function konverterBelop(belop, fra, til, arbeidsuke = '37.5') {
  const aar = fulltidsAarslonn(belop, fra, arbeidsuke);
  const { timerAar } = ARBEIDSUKER[arbeidsuke] ?? ARBEIDSUKER['37.5'];
  if (til === 'time') return Math.round((aar / timerAar) * 100) / 100;
  if (til === 'aar') return Math.round(aar);
  return Math.round(aar / 12);
}

// ---------------------------------------------------------------------------
// Skatt
// ---------------------------------------------------------------------------

export function minstefradrag(personinntekt) {
  return Math.min(Math.max(0, personinntekt) * SATSER.minstefradragSats, SATSER.minstefradragMaks);
}

export function trygdeavgift(personinntekt, sats = SATSER.trygdeavgiftSats) {
  if (personinntekt <= SATSER.trygdeavgiftFrigrense) return 0;
  const opptrapping =
    (personinntekt - SATSER.trygdeavgiftFrigrense) * SATSER.trygdeavgiftOpptrapping;
  return Math.min(personinntekt * sats, opptrapping);
}

export function trinnskatt(personinntekt) {
  const trinn = SATSER.trinnskatt;
  let skatt = 0;
  for (let i = 0; i < trinn.length; i++) {
    const [fra, sats] = trinn[i];
    const til = i + 1 < trinn.length ? trinn[i + 1][0] : Infinity;
    if (personinntekt > fra) skatt += (Math.min(personinntekt, til) - fra) * sats;
  }
  return skatt;
}

export function formuesskatt(nettoformue) {
  const f = Math.max(0, nettoformue);
  if (f <= SATSER.formuesskattInnslag) return 0;
  let skatt = (f - SATSER.formuesskattInnslag) * SATSER.formuesskattSats;
  if (f > SATSER.formuesskattTrinn2Innslag) {
    skatt += (f - SATSER.formuesskattTrinn2Innslag) * SATSER.formuesskattTrinn2Tillegg;
  }
  return skatt;
}

/**
 * Utlignet skatt for ett år.
 * @param {object} p
 * @param {number} p.personinntekt  lønn + feriepenger
 * @param {number} [p.fradrag]      fradrag i alminnelig inntekt (renter, fagforening, reise …)
 * @param {number} [p.tillegg]      tillegg i alminnelig inntekt (9000-tabellene)
 * @param {number} [p.bsuFradrag]   skattefradrag for BSU (kr direkte av skatten)
 * @param {number} [p.formue]       netto formue
 * @param {boolean} [p.medTrygdeavgift]
 */
export function beregnSkatt({
  personinntekt,
  fradrag = 0,
  tillegg = 0,
  bsuFradrag = 0,
  formue = 0,
  medTrygdeavgift = true,
}) {
  const pi = Math.max(0, personinntekt);
  const minste = minstefradrag(pi);
  const alminneligInntekt = pi - minste - SATSER.personfradrag - fradrag + tillegg;
  const skattAlminnelig = Math.max(0, alminneligInntekt) * SATSER.skattAlminnelig;
  const trygd = medTrygdeavgift ? trygdeavgift(pi) : 0;
  const trinn = trinnskatt(pi);
  const formuesSkatt = formuesskatt(formue);
  const forBsu = skattAlminnelig + trygd + trinn + formuesSkatt;
  const bsu = Math.min(bsuFradrag, forBsu);
  return {
    minstefradrag: minste,
    alminneligInntekt,
    skattAlminnelig,
    trygdeavgift: trygd,
    trinnskatt: trinn,
    formuesskatt: formuesSkatt,
    bsuFradrag: bsu,
    total: forBsu - bsu,
  };
}

// ---------------------------------------------------------------------------
// Tabelltrekk
// ---------------------------------------------------------------------------

export const SPESIALTABELLER = {
  7150: { navn: '7150 – 12 mnd trekk, ingen fradrag', maaneder: 12, trygd: true },
  7160: { navn: '7160 – 12 mnd trekk, uten trygdeavgift', maaneder: 12, trygd: false },
  7170: { navn: '7170 – 10,5 mnd trekk, uten trygdeavgift', maaneder: 10.5, trygd: false },
};

/** Alle gyldige tabellnummer: 8000–8400 (fradrag), 9010–9400 (tillegg) og 7150/7160/7170. */
export function alleTabeller() {
  const liste = [];
  for (let n = 8000; n <= 8400; n += 10) liste.push(String(n));
  for (let n = 9010; n <= 9400; n += 10) liste.push(String(n));
  return liste.concat(Object.keys(SPESIALTABELLER));
}

/** Hva en tabell forutsetter: fradrag/tillegg i alminnelig inntekt, trekkmåneder og trygdeavgift. */
export function tolkTabell(nummer) {
  const n = Number(nummer);
  if (SPESIALTABELLER[n]) {
    return { gyldig: true, fradrag: 0, tillegg: 0, ...SPESIALTABELLER[n] };
  }
  if (n >= 8000 && n <= 8400 && n % 10 === 0) {
    return { gyldig: true, fradrag: (n - 8000) * 1000, tillegg: 0, maaneder: 10.5, trygd: true };
  }
  if (n >= 9010 && n <= 9400 && n % 10 === 0) {
    return { gyldig: true, fradrag: 0, tillegg: (n - 9000) * 1000, maaneder: 10.5, trygd: true };
  }
  return { gyldig: false, fradrag: 0, tillegg: 0, maaneder: 10.5, trygd: true };
}

/** Tabellen som passer best til et fradrag (positivt) eller tillegg (negativt fradrag). */
export function anbefaltTabell(fradragEkvivalent) {
  if (fradragEkvivalent >= 0) {
    const steg = Math.min(40, Math.floor(fradragEkvivalent / 10_000));
    return String(8000 + steg * 10);
  }
  const steg = Math.min(40, Math.max(1, Math.round(-fradragEkvivalent / 10_000)));
  return String(9000 + steg * 10);
}

// ---------------------------------------------------------------------------
// Hovedberegning
// ---------------------------------------------------------------------------

/**
 * Regner ut hele året fra brukerens valg.
 * Modellen: fast månedslønn i 12 måneder, ferietrekk i juni (fastlønn) eller ubetalte
 * ferietimer (timelønn), og feriepenger av årets feriepengegrunnlag utbetalt i juni.
 */
export function beregn(innstillinger) {
  const v = { ...STANDARDVALG, ...innstillinger };
  const uke = ARBEIDSUKER[v.arbeidsuke] ?? ARBEIDSUKER['37.5'];
  const ferie = FERIEAVTALER[v.ferie] ?? FERIEAVTALER.fem;
  const stilling = tall(v.stilling, 0, 100) / 100;

  // --- Lønn -----------------------------------------------------------------
  const fulltid = fulltidsAarslonn(v.belop, v.lonnBasis, v.arbeidsuke);
  const nominellAar = fulltid * stilling; // 12 vanlige måneder
  const maanedslonn = nominellAar / 12;
  const timelonn = fulltid / uke.timerAar;
  const timerAar = uke.timerAar * stilling;

  // Ferietrekk: fastlønn trekkes virkedager/26 av månedslønna. Timelønnede får ikke
  // betalt for ferietimene. Begge gir samme beløp (6 virkedager = 1 uke = 1/52 år).
  const ferieuker = ferie.virkedager / 6;
  const ferietimer = ferieuker * uke.timerUke * stilling;
  const ferietrekk =
    v.lonnstype === 'time' ? ferietimer * timelonn : (ferie.virkedager / 26) * maanedslonn;

  const feriepengegrunnlag = Math.max(0, nominellAar - ferietrekk);
  const tilleggOver60 =
    Math.min(feriepengegrunnlag, 6 * SATSER.grunnbelop) * (ferie.tilleggOver60 ?? 0);
  const feriepenger = feriepengegrunnlag * ferie.sats + tilleggOver60;

  const personinntekt = feriepengegrunnlag + feriepenger;
  const betalteTimer = Math.max(0, timerAar - ferietimer);

  // --- Fradrag --------------------------------------------------------------
  const gjeld = tall(v.gjeld);
  const renteutgifter = gjeld * (tall(v.rente, 0, 100) / 100);
  const fagforening = Math.min(tall(v.fagforening), SATSER.fagforeningMaks);
  const reiseBrutto = tall(v.reiseKm) * tall(v.reiseDager, 0, 366) * SATSER.reisefradragPerKm;
  const reisefradrag = Math.min(
    Math.max(0, reiseBrutto - SATSER.reisefradragBunn),
    SATSER.reisefradragMaks,
  );
  const bsuFradrag = Math.min(tall(v.bsu), SATSER.bsuMaksSparing) * SATSER.bsuFradragSats;
  const formue = tall(v.formue);
  const andreFradrag = fagforening + reisefradrag;

  // --- Utlignet skatt (fasit ved skatteoppgjøret) ----------------------------
  const skatt = beregnSkatt({
    personinntekt,
    fradrag: renteutgifter + andreFradrag,
    bsuFradrag,
    formue,
  });
  const skattUtenRenter = beregnSkatt({
    personinntekt,
    fradrag: andreFradrag,
    bsuFradrag,
    formue,
  });
  const rentebesparelse = Math.max(0, skattUtenRenter.total - skatt.total);
  const skattUtenFradrag = beregnSkatt({ personinntekt, formue });
  const fradragsbesparelse = Math.max(0, skattUtenFradrag.total - skatt.total);

  // Fradrag omregnet til tabell: BSU og formuesskatt gjøres om til «fradrag» med 22 %.
  const fradragEkvivalent =
    renteutgifter +
    andreFradrag +
    skatt.bsuFradrag / SATSER.skattAlminnelig -
    skatt.formuesskatt / SATSER.skattAlminnelig;
  const anbefalt = anbefaltTabell(fradragEkvivalent);

  // --- Skattetrekk gjennom året ---------------------------------------------
  let trekk;
  if (v.skattemodus === 'prosent') {
    trekk = prosenttrekk(v, { maanedslonn, ferietrekk, feriepenger, personinntekt });
  } else {
    let maanedligTrekk;
    let trekkMaaneder = 10.5;
    let tabell = null;
    if (v.skattemodus === 'tabell') {
      tabell = tolkTabell(v.tabellnummer);
      const tabellSkatt = beregnSkatt({
        personinntekt,
        fradrag: tabell.fradrag,
        tillegg: tabell.tillegg,
        medTrygdeavgift: tabell.trygd,
      });
      trekkMaaneder = tabell.maaneder;
      maanedligTrekk = tabellSkatt.total / trekkMaaneder;
    } else {
      maanedligTrekk = skatt.total / 10.5;
    }
    trekk = tabellAarshjul({
      maanedligTrekk,
      trekkMaaneder,
      maanedslonn,
      ferietrekk,
      feriepenger,
      lonnstype: v.lonnstype,
    });
    trekk.tabell = tabell;
  }

  const sumTrekk = trekk.sumAar;
  const oppgjor = sumTrekk - skatt.total; // positivt = penger tilbake
  const nettoAar = personinntekt - skatt.total;
  const effektivSkatt = personinntekt > 0 ? skatt.total / personinntekt : 0;

  return {
    innstillinger: v,
    lonn: {
      fulltidsAarslonn: fulltid,
      nominellAarslonn: nominellAar,
      maanedslonn,
      timelonn,
      timerAar,
      betalteTimer,
      ferietimer,
      ferietrekk,
      feriepengegrunnlag,
      feriepenger,
      tilleggOver60,
      personinntekt,
    },
    fradrag: {
      renteutgifter,
      fagforening,
      reisefradrag,
      bsuFradrag: skatt.bsuFradrag,
      rentebesparelse,
      fradragsbesparelse,
      fradragEkvivalent,
      anbefaltTabell: anbefalt,
    },
    skatt: {
      ...skatt,
      effektiv: effektivSkatt,
      utenFradrag: skattUtenFradrag.total,
    },
    trekk,
    oppgjor,
    netto: {
      aar: nettoAar,
      vanligMaaned: maanedslonn - trekk.vanlig,
      juni: trekk.juni.netto,
      desember: trekk.desember.netto,
      timelonn: timelonn * (1 - effektivSkatt),
      utbetaltAar: personinntekt - sumTrekk,
    },
  };
}

// Tabelltrekk og «smart»: trekk i 10,5 måneder (juni trekkfri, halv skatt i desember).
// Juni: feriepenger er trekkfrie. Bare lønn utover feriepengene får vanlig trekk.
// Tabeller med 12 trekkmåneder trekker også i juni og fullt i desember.
function tabellAarshjul({
  maanedligTrekk,
  trekkMaaneder,
  maanedslonn,
  ferietrekk,
  feriepenger,
  lonnstype,
}) {
  const andel = maanedslonn > 0 ? maanedligTrekk / maanedslonn : 0;
  // Fastlønnede får ferietrekket i juni. Timelønnede jobber som vanlig i juni og
  // mister lønna den måneden de faktisk har ferie (vises som «ferietrekk» i juni-kortet).
  // Ferietrekket kan være større enn månedslønna (30/26) og spiser da av feriepengene.
  const lonnJuni = maanedslonn - ferietrekk;
  const brutto = Math.max(0, lonnJuni + feriepenger);
  let juniTrekk;
  let desemberTrekk;
  if (trekkMaaneder === 12) {
    juniTrekk = brutto * andel;
    desemberTrekk = maanedligTrekk;
  } else {
    juniTrekk = Math.max(0, lonnJuni - feriepenger) * andel;
    desemberTrekk = maanedligTrekk / 2;
  }
  const sumAar = maanedligTrekk * 10 + juniTrekk + desemberTrekk;
  return {
    modus: 'tabell',
    vanlig: maanedligTrekk,
    juni: {
      lonn: maanedslonn,
      ferietrekk,
      feriepenger,
      trekk: juniTrekk,
      netto: brutto - juniTrekk,
      lonnstype,
    },
    desember: { lonn: maanedslonn, trekk: desemberTrekk, netto: maanedslonn - desemberTrekk },
    sumAar,
  };
}

// Prosenttrekk: samme prosent av alt som utbetales, også feriepenger, ingen halv skatt.
// Frikort: ingen trekk opp til frikortgrensen, deretter 50 %.
function prosenttrekk(v, { maanedslonn, ferietrekk, feriepenger, personinntekt }) {
  const bruttoJuni = Math.max(0, maanedslonn - ferietrekk + feriepenger);
  let sats = tall(v.prosent, 0, 100) / 100;
  let frikortOver = 0;
  if (v.frikort) {
    frikortOver = Math.max(0, personinntekt - SATSER.frikortGrense);
    sats = personinntekt > 0 ? (frikortOver * SATSER.frikortTrekkOver) / personinntekt : 0;
  }
  const vanlig = maanedslonn * sats;
  const juniTrekk = bruttoJuni * sats;
  return {
    modus: 'prosent',
    sats,
    frikortOver,
    vanlig,
    juni: {
      lonn: maanedslonn,
      ferietrekk,
      feriepenger,
      trekk: juniTrekk,
      netto: bruttoJuni - juniTrekk,
      lonnstype: v.lonnstype,
    },
    desember: { lonn: maanedslonn, trekk: vanlig, netto: maanedslonn - vanlig },
    sumAar: vanlig * 11 + juniTrekk,
  };
}
