// Spørsmål og svar som vises under kalkulatoren og legges i FAQPage-JSON-LD i index.html
// (via vite.config.js). Én kilde, så teksten i JSON-LD alltid er lik den som vises.
// Tall hentes fra satser.js – ingen skattetall skrives inn her.

import { AAR, FERIEAVTALER, SATSER } from '../utils/satser.js';
import { kr, sats } from '../utils/format.js';

const fem = FERIEAVTALER.fem;
const eksempelLan = 3_000_000;
const eksempelRente = 0.055;
const eksempelRenter = eksempelLan * eksempelRente;

export const SPORSMAL = [
  {
    sporsmal: 'Hvorfor får jeg mer utbetalt i juni?',
    svar: `I juni får du feriepengene, og det trekkes vanligvis ikke skatt av dem. Samtidig trekkes du for ferien: med ${fem.kort} er trekket ${fem.virkedager}/26 av månedslønna. Feriepengene er ${sats(fem.sats)} av lønna, så summen blir som regel høyere enn en vanlig måned.`,
  },
  {
    sporsmal: 'Hva betyr halv skatt i desember?',
    svar: 'Med tabelltrekk fordeles skatten på 10,5 måneder: ingen trekk i juni og halvt trekk i desember (arbeidsgiveren velger om det halve trekket kommer i november eller desember). Du betaler ikke mindre skatt totalt – den er bare fordelt på de andre månedene.',
  },
  {
    sporsmal: 'Hvor mye sparer jeg i skatt på rentefradraget?',
    svar: `Du får ${sats(SATSER.skattAlminnelig)} av renteutgiftene i fradrag. Har du ${kr(eksempelLan)} i lån med ${sats(eksempelRente)} rente, betaler du ${kr(eksempelRenter)} i renter og sparer ${kr(eksempelRenter * SATSER.skattAlminnelig)} i skatt i året.`,
  },
  {
    sporsmal: 'Hvilket tabellnummer bør jeg ha på skattekortet?',
    svar: 'Fra 2025 heter tabellene 8000–8400, der de tre siste sifrene er fradraget i tusen kroner (8050 betyr 50 000 kr). Kalkulatoren regner trekket slik Skatteetatens tabeller gjør, foreslår den tabellen som passer best med rentene og fradragene dine, og viser om du får restskatt eller penger tilbake.',
  },
  {
    sporsmal: 'Hvor mye kan jeg tjene ved siden av uføretrygd?',
    svar: `Du kan tjene opp til bunnfradraget før uføretrygden reduseres. Bunnfradraget er inntekten etter uførhet pluss et fribeløp på ${SATSER.uforeFribelopG['1g']} G når du har hatt uføretrygd i to år, ellers ${tall04g()} G. Over bunnfradraget reduseres trygda med reduksjonsprosenten, som er maks ${SATSER.uforeReduksjonMaks} %.`,
  },
  {
    sporsmal: 'Lagres tallene mine noe sted?',
    svar: `Nei, alt regnes ut i nettleseren din, og ingen tall sendes til noen server. Valgene huskes bare lokalt på enheten din, og du kan slette dem med knappen «Nullstill». Satsene er for skatteåret ${AAR}.`,
  },
];

function tall04g() {
  return String(SATSER.uforeFribelopG['04g']).replace('.', ',');
}
