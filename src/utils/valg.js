// Rensing av valg som leses fra localStorage. Lagret JSON kan være gammel, endret for hånd eller
// ødelagt, så hvert felt sjekkes mot gyldige verdier og området i skjemaet. Ugyldige felt
// får standardverdien, og tall utenfor området klemmes.

import { ARBEIDSUKER, FERIEAVTALER, SATSER } from './satser.js';
import { STANDARDVALG } from './taxCalculator.js';
import { tolkTabell } from './trekktabell.js';

// [min, maks] per tallfelt. Skal ikke være trangere enn det skjemaet godtar.
const TALLOMRAADE = {
  stilling: [0, 100],
  uforetrygd: [0, 2_000_000],
  ieu: [0, 2_000_000],
  reduksjonsprosent: [0, SATSER.uforeReduksjonMaks],
  gjeld: [0, 100_000_000],
  rente: [0, 30],
  fagforening: [0, 100_000],
  bsu: [0, SATSER.bsuMaksSparing],
  reiseKm: [0, 2_000],
  reiseDager: [0, 366],
  formue: [0, 10_000_000_000],
  prosent: [0, 100],
};

// Lønnsbeløpets tak avhenger av om det er timelønn, månedslønn eller årslønn.
const BELOEP_MAKS = { time: 5_000, maaned: 1_000_000, aar: 12_000_000 };

const VALGLISTER = {
  lonnBasis: Object.keys(BELOEP_MAKS),
  arbeidsuke: Object.keys(ARBEIDSUKER),
  lonnstype: ['fast', 'time'],
  fribelop: Object.keys(SATSER.uforeFribelopG),
  skattemodus: ['smart', 'tabell', 'prosent'],
  ferie: Object.keys(FERIEAVTALER),
};

const klem = (n, [min, maks]) => Math.min(maks, Math.max(min, n));

/**
 * Gjør om ukjent data (fra JSON.parse) til et komplett, gyldig sett med valg.
 * Felt som mangler eller er ugyldige får standardverdi, og ukjente felt droppes.
 */
export function rensValg(data) {
  const valg = { ...STANDARDVALG };
  if (!data || typeof data !== 'object' || Array.isArray(data)) return valg;
  // Bare egne felt, så ingenting kan komme inn via prototypen.
  const les = (nokkel) => (Object.hasOwn(data, nokkel) ? data[nokkel] : undefined);
  const erTall = (v) => typeof v === 'number' && Number.isFinite(v);

  for (const [nokkel, liste] of Object.entries(VALGLISTER)) {
    if (liste.includes(les(nokkel))) valg[nokkel] = les(nokkel);
  }
  for (const [nokkel, omraade] of Object.entries(TALLOMRAADE)) {
    if (erTall(les(nokkel))) valg[nokkel] = klem(les(nokkel), omraade);
  }
  if (erTall(les('belop'))) valg.belop = klem(les('belop'), [0, BELOEP_MAKS[valg.lonnBasis]]);
  for (const nokkel of ['ufore', 'frikort']) {
    if (typeof les(nokkel) === 'boolean') valg[nokkel] = les(nokkel);
  }
  const tabell = les('tabellnummer');
  if (typeof tabell === 'string' && tolkTabell(tabell).gyldig) valg.tabellnummer = tabell;
  return valg;
}
