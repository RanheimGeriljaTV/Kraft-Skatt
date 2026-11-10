import { describe, expect, it } from 'vitest';
import {
  alleTabeller,
  anbefaltTabell,
  beregn,
  beregnSkatt,
  formuesskatt,
  fulltidsAarslonn,
  konverterBelop,
  minstefradrag,
  tolkTabell,
  trinnskatt,
  trygdeavgift,
} from './taxCalculator.js';

describe('lønn', () => {
  it('regner fulltids årslønn fra time, måned og år', () => {
    expect(fulltidsAarslonn(300, 'time', '37.5')).toBe(585_000);
    expect(fulltidsAarslonn(300, 'time', '35.5')).toBe(553_800);
    expect(fulltidsAarslonn(50_000, 'maaned')).toBe(600_000);
    expect(fulltidsAarslonn(600_000, 'aar')).toBe(600_000);
  });

  it('konverterer mellom faner uten å endre årslønna', () => {
    expect(konverterBelop(600_000, 'aar', 'maaned')).toBe(50_000);
    expect(konverterBelop(50_000, 'maaned', 'time', '37.5')).toBeCloseTo(307.69, 2);
  });
});

describe('skattegrunnlag 2026', () => {
  it('minstefradrag er 46 % med tak på 95 700', () => {
    expect(minstefradrag(100_000)).toBe(46_000);
    expect(minstefradrag(1_000_000)).toBe(95_700);
  });

  it('trygdeavgift har frigrense og opptrapping', () => {
    expect(trygdeavgift(99_650)).toBe(0);
    expect(trygdeavgift(110_000)).toBeCloseTo(2_587.5, 1); // 25 % av 10 350
    expect(trygdeavgift(600_000)).toBeCloseTo(45_600, 5);
  });

  it('trinnskatt følger trinnene', () => {
    expect(trinnskatt(226_100)).toBe(0);
    expect(trinnskatt(318_300)).toBeCloseTo(92_200 * 0.017, 5);
    const ved1mill =
      92_200 * 0.017 + 406_750 * 0.04 + 255_050 * 0.137 + (1_000_000 - 980_100) * 0.168;
    expect(trinnskatt(1_000_000)).toBeCloseTo(ved1mill, 5);
  });

  it('formuesskatt er 1 % over 1,9 mill. og 1,1 % over 21,5 mill.', () => {
    expect(formuesskatt(1_900_000)).toBe(0);
    expect(formuesskatt(2_900_000)).toBeCloseTo(10_000, 5);
    expect(formuesskatt(22_500_000)).toBeCloseTo(206_000 + 1_000, 5);
  });

  it('beregner total skatt for 600 000 kr uten fradrag', () => {
    const s = beregnSkatt({ personinntekt: 600_000 });
    const alminnelig = (600_000 - 95_700 - 114_540) * 0.22;
    const trinn = 92_200 * 0.017 + (600_000 - 318_300) * 0.04;
    expect(s.total).toBeCloseTo(alminnelig + 45_600 + trinn, 5);
  });

  it('BSU-fradrag kan ikke gi negativ skatt', () => {
    const s = beregnSkatt({ personinntekt: 50_000, bsuFradrag: 2_750 });
    expect(s.total).toBe(0);
  });
});

describe('tabeller', () => {
  it('tolker 8000-, 9000- og spesialtabeller', () => {
    expect(tolkTabell('8050')).toMatchObject({ gyldig: true, fradrag: 50_000, maaneder: 10.5 });
    expect(tolkTabell('9120')).toMatchObject({ gyldig: true, tillegg: 120_000 });
    expect(tolkTabell('7150')).toMatchObject({ gyldig: true, maaneder: 12, trygd: true });
    expect(tolkTabell('7100').gyldig).toBe(false);
  });

  it('anbefaler riktig tabell', () => {
    expect(anbefaltTabell(0)).toBe('8000');
    expect(anbefaltTabell(55_000)).toBe('8050');
    expect(anbefaltTabell(9_000_000)).toBe('8400');
    expect(anbefaltTabell(-30_000)).toBe('9030');
  });

  it('har 41 + 40 + 3 tabeller', () => {
    expect(alleTabeller()).toHaveLength(84);
  });
});

describe('hele året', () => {
  const grunn = { lonnBasis: 'maaned', belop: 50_000, ferie: 'fem' };

  it('feriepenger er 12 % av lønn minus ferietrekk (30/26 måned)', () => {
    const r = beregn(grunn);
    const ferietrekk = (30 / 26) * 50_000;
    expect(r.lonn.ferietrekk).toBeCloseTo(ferietrekk, 5);
    expect(r.lonn.feriepenger).toBeCloseTo((600_000 - ferietrekk) * 0.12, 5);
    expect(r.lonn.personinntekt).toBeCloseTo(600_000 - ferietrekk + r.lonn.feriepenger, 5);
  });

  it('utbetalingene gjennom året summerer seg til personinntekten', () => {
    for (const ferie of ['fem', 'lov', 'over60']) {
      for (const skattemodus of ['smart', 'tabell', 'prosent']) {
        const r = beregn({ ...grunn, ferie, skattemodus, gjeld: 1_500_000 });
        const brutto = 11 * r.lonn.maanedslonn + r.trekk.juni.netto + r.trekk.juni.trekk;
        expect(brutto).toBeCloseTo(r.lonn.personinntekt, 5);
        expect(r.netto.utbetaltAar).toBeCloseTo(
          10 * r.netto.vanligMaaned + r.netto.juni + r.netto.desember,
          5,
        );
      }
    }
  });

  it('juni: ferietrekket går til fradrag i feriepengene (5 uker, 50 000 kr)', () => {
    const r = beregn(grunn);
    expect(r.trekk.juni.netto).toBeCloseTo(50_000 - r.lonn.ferietrekk + r.lonn.feriepenger, 5);
    expect(r.trekk.juni.netto).toBeCloseTo(57_385, 0);
  });

  it('fastlønn og timelønn gir samme ferietrekk', () => {
    const fast = beregn({ ...grunn, lonnstype: 'fast' });
    const time = beregn({ ...grunn, lonnstype: 'time' });
    expect(time.lonn.ferietrekk).toBeCloseTo(fast.lonn.ferietrekk, 5);
  });

  it('smart beregning trekker riktig skatt over 10,5 måneder', () => {
    const r = beregn(grunn);
    expect(r.trekk.vanlig).toBeCloseTo(r.skatt.total / 10.5, 5);
    expect(r.trekk.juni.trekk).toBe(0);
    expect(r.trekk.desember.trekk).toBeCloseTo(r.trekk.vanlig / 2, 5);
    expect(Math.abs(r.oppgjor)).toBeLessThan(1);
  });

  it('rentefradrag gir 22 % av renteutgiftene i besparelse', () => {
    const r = beregn({ ...grunn, gjeld: 2_000_000, rente: 5 });
    expect(r.fradrag.renteutgifter).toBe(100_000);
    expect(r.fradrag.rentebesparelse).toBeCloseTo(22_000, 5);
    expect(r.fradrag.anbefaltTabell).toBe('8100');
  });

  it('fagforening er begrenset til 8 700 kr', () => {
    const r = beregn({ ...grunn, fagforening: 12_000 });
    expect(r.fradrag.fagforening).toBe(8_700);
  });

  it('reisefradrag trekker fra bunnbeløpet', () => {
    const r = beregn({ ...grunn, reiseKm: 60, reiseDager: 200 });
    expect(r.fradrag.reisefradrag).toBeCloseTo(60 * 200 * 1.9 - 12_000, 5);
  });

  it('tabell 8000 gir restskatt for den som har store rentefradrag å hente', () => {
    const r = beregn({ ...grunn, gjeld: 3_000_000, rente: 5, skattemodus: 'tabell' });
    expect(r.oppgjor).toBeGreaterThan(30_000); // penger tilbake
  });

  it('prosenttrekk trekker også i juni og fullt i desember', () => {
    const r = beregn({ ...grunn, skattemodus: 'prosent', prosent: 30 });
    expect(r.trekk.vanlig).toBeCloseTo(15_000, 5);
    expect(r.trekk.desember.trekk).toBeCloseTo(15_000, 5);
    expect(r.trekk.juni.trekk).toBeGreaterThan(0);
  });

  it('frikort gir null trekk under grensen', () => {
    const r = beregn({ lonnBasis: 'aar', belop: 80_000, skattemodus: 'prosent', frikort: true });
    expect(r.trekk.sumAar).toBe(0);
  });

  it('over 60 år gir 2,3 % ekstra, men bare av grunnlag opp til 6 G', () => {
    const r = beregn({ lonnBasis: 'aar', belop: 1_200_000, ferie: 'over60' });
    expect(r.lonn.tilleggOver60).toBeCloseTo(6 * 130_160 * 0.023, 5);
  });

  it('stillingsprosent skalerer lønna', () => {
    const r = beregn({ ...grunn, stilling: 50 });
    expect(r.lonn.maanedslonn).toBe(25_000);
  });

  it('håndterer null og ugyldige tall uten NaN', () => {
    const r = beregn({ belop: 'abc', gjeld: -5, stilling: 0 });
    expect(r.netto.vanligMaaned).toBe(0);
    expect(r.skatt.effektiv).toBe(0);
    expect(Number.isNaN(r.netto.timelonn)).toBe(false);
  });
});
