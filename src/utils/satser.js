// Skattesatser for inntektsåret 2026.
// Kilde: regjeringen.no «Skattesatser 2026» (22.12.2025) og Skatteetaten
// «Oversikt over tabelltrinnene for trekktabeller fra og med 2025».
// Oppdater alle tallene her når et nytt inntektsår starter.

export const AAR = 2026;

export const SATSER = {
  // Alminnelig inntekt
  skattAlminnelig: 0.22,
  personfradrag: 114_540,
  minstefradragSats: 0.46,
  minstefradragMaks: 95_700,

  // Trygdeavgift på lønn
  trygdeavgiftSats: 0.076,
  trygdeavgiftFrigrense: 99_650,
  trygdeavgiftOpptrapping: 0.25,

  // Trinnskatt på personinntekt [innslagspunkt, sats]
  trinnskatt: [
    [226_100, 0.017],
    [318_300, 0.04],
    [725_050, 0.137],
    [980_100, 0.168],
    [1_467_200, 0.178],
  ],

  // Formuesskatt (enslig): kommune 0,35 % + stat 0,65 % over innslagspunktet,
  // og stat trinn 2 (0,75 % i stedet for 0,65 %) over 21,5 mill. kr.
  formuesskattInnslag: 1_900_000,
  formuesskattSats: 0.01,
  formuesskattTrinn2Innslag: 21_500_000,
  formuesskattTrinn2Tillegg: 0.001,

  // Fradrag
  fagforeningMaks: 8_700,
  bsuMaksSparing: 27_500,
  bsuFradragSats: 0.1,
  reisefradragPerKm: 1.9,
  reisefradragBunn: 12_000,
  reisefradragMaks: 120_000,

  // Frikort
  frikortGrense: 100_000,
  frikortTrekkOver: 0.5,

  // Folketrygdens grunnbeløp per 1. januar 2026 (brukes for ekstra ferie over 60 år:
  // tilleggsferiepengene beregnes bare av grunnlag opptil 6 G).
  grunnbelop: 130_160,
  // Gjennomsnittlig G for 2026 (130 160 kr til 30. april, 136 549 kr fra 1. mai).
  // Brukes for årsbeløp i uføreberegningen. Kilde: regjeringen.no / Nav.
  grunnbelopSnitt: 134_419,

  // Uføretrygd (Nav, «Regelendringer for uføretrygd i 2026», oppdatert 17.09.2026).
  // Bunnfradrag = inntekt etter uførhet (IEU) + fribeløp. Fribeløpet er 0,4 G de første
  // 24 månedene og 1 G etter det (virkning fra 1.1.2026). Uføretrygden reduseres med
  // reduksjonsprosenten av inntekt over bunnfradraget, maks 70 % fra 1.7.2026.
  // Uføretrygd skattes som lønn, er trekkfri i juni og har halvt trekk i desember.
  uforeFribelopG: { '1g': 1, '04g': 0.4 },
  uforeReduksjonMaks: 70,
  uforeMinsteYtelseEnsligG: 2.529,
};

// Ferieavtaler. Virkedager regnes mandag–lørdag (6 per uke), som i ferieloven.
export const FERIEAVTALER = {
  fem: { navn: '5 uker (12 %)', kort: '5 uker', sats: 0.12, virkedager: 30, tilleggOver60: 0 },
  lov: {
    navn: '4 uker + 1 dag (10,2 %)',
    kort: '4 uker + 1 dag',
    sats: 0.102,
    virkedager: 25,
    tilleggOver60: 0,
  },
  over60: {
    navn: 'Over 60 år (12 % + 2,3 %)',
    kort: '6 uker',
    sats: 0.12,
    virkedager: 36,
    tilleggOver60: 0.023,
  },
};

export const ARBEIDSUKER = {
  37.5: { navn: '37,5 t/uke', timerAar: 1950, timerUke: 37.5 },
  35.5: { navn: '35,5 t/uke', timerAar: 1846, timerUke: 35.5 },
};
