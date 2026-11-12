// Ren beregningsmotor for lønn, uføretrygd, skatt, gjeld og feriepenger.
// Ingen avhengigheter til React eller nettleseren, så alt kan testes isolert.

import { ARBEIDSUKER, FERIEAVTALER, SATSER } from './satser.js';

export const STANDARDVALG = {
  lonnBasis: 'maaned', // 'time' | 'maaned' | 'aar'
  belop: 50_000, // det du faktisk tjener i valgt basis (timelønn er per time)
  stilling: 100, // prosent – gir antall arbeidstimer
  arbeidsuke: '37.5',
  lonnstype: 'fast', // 'fast' | 'time'
  ufore: false,
  uforetrygd: 0, // kr per år før reduksjon (står i vedtaket)
  ieu: 0, // inntekt etter uførhet, kr per år (0 ved 100 % uføregrad)
  fribelop: '1g', // '1g' (uføretrygd i 2 år eller mer) | '04g' (første 24 måneder)
  reduksjonsprosent: 66, // står i vedtaket, maks 70
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

const uke = (arbeidsuke) => ARBEIDSUKER[arbeidsuke] ?? ARBEIDSUKER['37.5'];

// ---------------------------------------------------------------------------
// Lønn
// ---------------------------------------------------------------------------

/**
 * Årslønn fra beløpet brukeren skriver inn. Månedslønn og årslønn er det man faktisk
 * tjener. Timelønn ganges med årstimene i stillingen.
 */
export function aarslonnFraBelop(belop, basis, stilling = 100, arbeidsuke = '37.5') {
  const b = tall(belop);
  if (basis === 'time') return b * uke(arbeidsuke).timerAar * (tall(stilling, 0, 100) / 100);
  if (basis === 'aar') return b;
  return b * 12;
}

/** Gjør om beløpet fra én fane til en annen uten å endre årslønna. */
export function konverterBelop(belop, fra, til, stilling = 100, arbeidsuke = '37.5') {
  const aar = aarslonnFraBelop(belop, fra, stilling, arbeidsuke);
  const timer = uke(arbeidsuke).timerAar * (tall(stilling, 0, 100) / 100);
  if (til === 'time') return timer > 0 ? Math.round((aar / timer) * 100) / 100 : 0;
  if (til === 'aar') return Math.round(aar);
  return Math.round(aar / 12);
}

/** Lønn og feriepenger for ett år med stabil lønn. */
export function beregnJobb(v) {
  const u = uke(v.arbeidsuke);
  const ferie = FERIEAVTALER[v.ferie] ?? FERIEAVTALER.fem;
  const stilling = tall(v.stilling, 0, 100) / 100;

  const nominellAar = aarslonnFraBelop(v.belop, v.lonnBasis, v.stilling, v.arbeidsuke);
  const maanedslonn = nominellAar / 12;
  const timerAar = u.timerAar * stilling;
  const timelonn = timerAar > 0 ? nominellAar / timerAar : 0;

  // Ferietrekk: fastlønn trekkes virkedager/26 av månedslønna. Timelønnede får ikke
  // betalt for ferietimene. Begge gir samme beløp (6 virkedager = 1 uke = 1/52 år).
  const ferieuker = ferie.virkedager / 6;
  const ferietimer = ferieuker * u.timerUke * stilling;
  const ferietrekk =
    v.lonnstype === 'time' ? ferietimer * timelonn : (ferie.virkedager / 26) * maanedslonn;

  const feriepengegrunnlag = Math.max(0, nominellAar - ferietrekk);
  const tilleggOver60 =
    Math.min(feriepengegrunnlag, 6 * SATSER.grunnbelop) * (ferie.tilleggOver60 ?? 0);
  const feriepenger = feriepengegrunnlag * ferie.sats + tilleggOver60;

  return {
    nominellAarslonn: nominellAar,
    maanedslonn,
    timelonn,
    timerAar,
    betalteTimer: Math.max(0, timerAar - ferietimer),
    ferietimer,
    ferietrekk,
    feriepengegrunnlag,
    feriepenger,
    tilleggOver60,
    personinntekt: feriepengegrunnlag + feriepenger,
  };
}

// ---------------------------------------------------------------------------
// Uføretrygd
// ---------------------------------------------------------------------------

/**
 * Uføretrygd etter reduksjon for arbeidsinntekt.
 * Bunnfradrag = IEU + fribeløp. Inntekt over bunnfradraget reduserer trygda med
 * reduksjonsprosenten (maks 70 %).
 */
export function beregnUfore(v, arbeidsinntekt) {
  if (!v.ufore) {
    return { aktiv: false, fullYtelse: 0, bunnfradrag: 0, reduksjon: 0, utbetalt: 0 };
  }
  const fullYtelse = tall(v.uforetrygd);
  const fribelop = (SATSER.uforeFribelopG[v.fribelop] ?? 1) * SATSER.grunnbelopSnitt;
  const bunnfradrag = tall(v.ieu) + fribelop;
  const reduksjonsprosent = tall(v.reduksjonsprosent, 0, SATSER.uforeReduksjonMaks);
  const over = Math.max(0, arbeidsinntekt - bunnfradrag);
  const reduksjon = Math.min(fullYtelse, over * (reduksjonsprosent / 100));
  return {
    aktiv: true,
    fullYtelse,
    fribelop,
    bunnfradrag,
    reduksjonsprosent,
    overBunnfradrag: over,
    igjenFoerReduksjon: Math.max(0, bunnfradrag - arbeidsinntekt),
    reduksjon,
    utbetalt: fullYtelse - reduksjon,
  };
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
 * ferietimer (timelønn), feriepenger utbetalt i juni, og eventuell uføretrygd fra Nav
 * fordelt likt på 12 måneder.
 */
export function beregn(innstillinger, { utenRekursjon = false } = {}) {
  const v = { ...STANDARDVALG, ...innstillinger };
  const lonn = beregnJobb(v);
  const ufore = beregnUfore(v, lonn.personinntekt);
  const personinntekt = lonn.personinntekt + ufore.utbetalt;
  const uforeMaaned = ufore.utbetalt / 12;

  // --- Fradrag --------------------------------------------------------------
  const gjeld = tall(v.gjeld);
  const renteutgifter = gjeld * (tall(v.rente, 0, 100) / 100);
  const fagforening = Math.min(tall(v.fagforening), SATSER.fagforeningMaks);
  const reisekostnad = tall(v.reiseKm) * tall(v.reiseDager, 0, 366) * SATSER.reisefradragPerKm;
  const reisefradrag = Math.min(
    Math.max(0, reisekostnad - SATSER.reisefradragBunn),
    SATSER.reisefradragMaks,
  );
  const bsuFradrag = Math.min(tall(v.bsu), SATSER.bsuMaksSparing) * SATSER.bsuFradragSats;
  const formue = tall(v.formue);
  const andreFradrag = fagforening + reisefradrag;
  const alleFradrag = { fradrag: renteutgifter + andreFradrag, bsuFradrag, formue };

  // --- Utlignet skatt (fasit ved skatteoppgjøret) ----------------------------
  const skatt = beregnSkatt({ personinntekt, ...alleFradrag });
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

  // --- Skattetrekk gjennom året ---------------------------------------------
  const grunnlag = {
    maanedslonn: lonn.maanedslonn,
    ferietrekk: lonn.ferietrekk,
    feriepenger: lonn.feriepenger,
    uforeMaaned,
    lonnstype: v.lonnstype,
  };
  const skattBareUfore = ufore.aktiv
    ? beregnSkatt({ personinntekt: ufore.utbetalt, ...alleFradrag }).total
    : 0;
  let trekk;
  if (ufore.aktiv) {
    trekk = uforeTrekk(v, {
      ...grunnlag,
      arbeidsinntekt: lonn.personinntekt,
      uforeAar: ufore.utbetalt,
      skattTotal: skatt.total,
      skattBareUfore,
      personinntekt,
    });
  } else if (v.skattemodus === 'prosent') {
    trekk = prosenttrekk(v, { ...grunnlag, personinntekt });
  } else {
    let maanedligTrekk = skatt.total / 10.5;
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
    }
    trekk = tabellAarshjul({ ...grunnlag, maanedligTrekk, trekkMaaneder });
    trekk.tabell = tabell;
  }

  const oppgjor = trekk.sumAar - skatt.total; // positivt = penger tilbake
  const vanligMaaned = trekk.vanligBrutto - trekk.vanlig;

  // Hvor mye mer som faktisk utbetales i en vanlig måned på grunn av rentefradraget.
  // Regnes som forskjellen mot samme situasjon uten gjeld, så det blir 0 med tabell- og
  // prosenttrekk (trekket står fast), og riktig også med uføretrygd.
  const rentebesparelseMaaned =
    !utenRekursjon && renteutgifter > 0
      ? vanligMaaned -
        beregn({ ...innstillinger, gjeld: 0 }, { utenRekursjon: true }).netto.vanligMaaned
      : 0;
  const nettoAar = personinntekt - skatt.total;
  const effektivSkatt = personinntekt > 0 ? skatt.total / personinntekt : 0;

  // Hva jobben faktisk gir: netto med jobb minus netto uten jobb (etter skatt og
  // eventuell reduksjon i uføretrygden), fordelt på arbeidstimene.
  const utenJobbInntekt = ufore.aktiv ? ufore.fullYtelse : 0;
  const nettoUtenJobb =
    utenJobbInntekt - beregnSkatt({ personinntekt: utenJobbInntekt, ...alleFradrag }).total;
  const jobbGevinst = nettoAar - nettoUtenJobb;
  const nettoPerTime = lonn.betalteTimer > 0 ? jobbGevinst / lonn.betalteTimer : 0;

  return {
    innstillinger: v,
    lonn: { ...lonn, personinntekt, arbeidsinntekt: lonn.personinntekt },
    ufore: { ...ufore, maaned: uforeMaaned },
    fradrag: {
      renteutgifter,
      fagforening,
      reisekostnad,
      reisefradrag,
      bsuFradrag: skatt.bsuFradrag,
      rentebesparelse,
      rentebesparelseMaaned,
      fradragsbesparelse,
      fradragEkvivalent,
      anbefaltTabell: anbefaltTabell(fradragEkvivalent),
      // Prosenttrekk hos arbeidsgiveren når Nav trekker skatten på uføretrygden alene.
      anbefaltBikort:
        ufore.aktiv && lonn.personinntekt > 0
          ? (skatt.total - skattBareUfore) / lonn.personinntekt
          : 0,
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
      vanligMaaned,
      juni: trekk.juni.netto,
      desember: trekk.desember.netto,
      timelonn: lonn.timelonn * (1 - effektivSkatt),
      perArbeidstime: nettoPerTime,
      jobbGevinst,
      utbetaltAar: personinntekt - trekk.sumAar,
    },
  };
}

// Tabelltrekk og «smart»: trekk i 10,5 måneder (juni trekkfri, halv skatt i desember).
// Juni: feriepenger og uføretrygd er trekkfrie. Bare lønn utover feriepengene får trekk.
// Tabeller med 12 trekkmåneder trekker også i juni og fullt i desember.
function tabellAarshjul({
  maanedligTrekk,
  trekkMaaneder,
  maanedslonn,
  ferietrekk,
  feriepenger,
  uforeMaaned,
  lonnstype,
}) {
  const vanligBrutto = maanedslonn + uforeMaaned;
  const andel = vanligBrutto > 0 ? maanedligTrekk / vanligBrutto : 0;
  // Ferietrekket kan være større enn månedslønna (30/26) og spiser da av feriepengene.
  const lonnJuni = maanedslonn - ferietrekk;
  const juniBrutto = Math.max(0, lonnJuni + feriepenger) + uforeMaaned;
  let juniTrekk;
  let desemberTrekk;
  if (trekkMaaneder === 12) {
    juniTrekk = juniBrutto * andel;
    desemberTrekk = maanedligTrekk;
  } else {
    juniTrekk = Math.max(0, lonnJuni - feriepenger) * andel;
    desemberTrekk = maanedligTrekk / 2;
  }
  return {
    modus: 'tabell',
    vanlig: maanedligTrekk,
    vanligBrutto,
    juni: {
      lonn: maanedslonn,
      ferietrekk,
      feriepenger,
      ufore: uforeMaaned,
      trekk: juniTrekk,
      netto: juniBrutto - juniTrekk,
      lonnstype,
    },
    desember: {
      lonn: maanedslonn,
      ufore: uforeMaaned,
      trekk: desemberTrekk,
      netto: vanligBrutto - desemberTrekk,
    },
    sumAar: maanedligTrekk * 10 + juniTrekk + desemberTrekk,
  };
}

/**
 * Uføretrygd + lønn: to utbetalere med hvert sitt trekk.
 * - Nav trekker av uføretrygden i 10,5 måneder: nullskatt i juni og halv skatt i desember
 *   (12 måneder hvis tabellen er en 12-månederstabell).
 * - Arbeidsgiveren trekker prosent (bikort) av all lønn, også feriepenger og i desember.
 * Smart: Nav trekker skatten på uføretrygden alene, og arbeidsgiveren trekker resten, som er
 * marginalskatten på lønna. Da går trekket opp i null ved skatteoppgjøret.
 */
function uforeTrekk(
  v,
  {
    maanedslonn,
    ferietrekk,
    feriepenger,
    uforeMaaned,
    lonnstype,
    arbeidsinntekt,
    uforeAar,
    skattTotal,
    skattBareUfore,
    personinntekt,
  },
) {
  let navMaanedlig;
  let navMaaneder = 10.5;
  let arbeidsgiverSats;
  let tabell = null;

  if (v.skattemodus === 'smart') {
    navMaanedlig = skattBareUfore / 10.5;
    arbeidsgiverSats = arbeidsinntekt > 0 ? (skattTotal - skattBareUfore) / arbeidsinntekt : 0;
  } else {
    let sats = tall(v.prosent, 0, 100) / 100;
    if (v.skattemodus === 'prosent' && v.frikort) {
      const over = Math.max(0, personinntekt - SATSER.frikortGrense);
      sats = personinntekt > 0 ? (over * SATSER.frikortTrekkOver) / personinntekt : 0;
    }
    arbeidsgiverSats = sats;
    if (v.skattemodus === 'tabell') {
      tabell = tolkTabell(v.tabellnummer);
      const tabellSkatt = beregnSkatt({
        personinntekt: uforeAar,
        fradrag: tabell.fradrag,
        tillegg: tabell.tillegg,
        medTrygdeavgift: tabell.trygd,
      });
      navMaaneder = tabell.maaneder;
      navMaanedlig = tabellSkatt.total / navMaaneder;
    } else {
      navMaanedlig = uforeMaaned * sats;
    }
  }

  const tolv = navMaaneder === 12;
  const navJuni = tolv ? navMaanedlig : 0;
  const navDesember = tolv ? navMaanedlig : navMaanedlig / 2;

  const lonnJuniBrutto = Math.max(0, maanedslonn - ferietrekk + feriepenger);
  const agVanlig = maanedslonn * arbeidsgiverSats;
  const agJuni = lonnJuniBrutto * arbeidsgiverSats;

  const vanligBrutto = maanedslonn + uforeMaaned;
  const juniBrutto = lonnJuniBrutto + uforeMaaned;
  return {
    modus: 'ufore',
    skattemodus: v.skattemodus,
    tabell,
    navMaanedlig,
    navMaaneder,
    arbeidsgiverSats,
    vanlig: navMaanedlig + agVanlig,
    vanligBrutto,
    vanligDeler: { lonn: agVanlig, ufore: navMaanedlig },
    juni: {
      lonn: maanedslonn,
      ferietrekk,
      feriepenger,
      ufore: uforeMaaned,
      trekk: agJuni + navJuni,
      trekkLonn: agJuni,
      trekkUfore: navJuni,
      netto: juniBrutto - agJuni - navJuni,
      lonnstype,
    },
    desember: {
      lonn: maanedslonn,
      ufore: uforeMaaned,
      trekk: agVanlig + navDesember,
      trekkLonn: agVanlig,
      trekkUfore: navDesember,
      netto: vanligBrutto - agVanlig - navDesember,
    },
    sumAar: navMaanedlig * 10 + navJuni + navDesember + arbeidsgiverSats * arbeidsinntekt,
  };
}

// Prosenttrekk: samme prosent av alt som utbetales, også feriepenger, ingen halv skatt.
// Frikort: ingen trekk opp til frikortgrensen, deretter 50 %.
function prosenttrekk(
  v,
  { maanedslonn, ferietrekk, feriepenger, uforeMaaned, lonnstype, personinntekt },
) {
  const vanligBrutto = maanedslonn + uforeMaaned;
  const juniBrutto = Math.max(0, maanedslonn - ferietrekk + feriepenger) + uforeMaaned;
  let sats = tall(v.prosent, 0, 100) / 100;
  let frikortOver = 0;
  if (v.frikort) {
    frikortOver = Math.max(0, personinntekt - SATSER.frikortGrense);
    sats = personinntekt > 0 ? (frikortOver * SATSER.frikortTrekkOver) / personinntekt : 0;
  }
  const vanlig = vanligBrutto * sats;
  const juniTrekk = juniBrutto * sats;
  return {
    modus: 'prosent',
    sats,
    frikortOver,
    vanlig,
    vanligBrutto,
    juni: {
      lonn: maanedslonn,
      ferietrekk,
      feriepenger,
      ufore: uforeMaaned,
      trekk: juniTrekk,
      netto: juniBrutto - juniTrekk,
      lonnstype,
    },
    desember: {
      lonn: maanedslonn,
      ufore: uforeMaaned,
      trekk: vanlig,
      netto: vanligBrutto - vanlig,
    },
    sumAar: vanlig * 11 + juniTrekk,
  };
}
