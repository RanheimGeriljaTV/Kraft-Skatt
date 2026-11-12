import { describe, expect, it } from 'vitest';
import {
  alleTabeller,
  anbefaltTabell,
  beregn,
  beregnSkatt,
  formuesskatt,
  aarslonnFraBelop,
  beregnUfore,
  konverterBelop,
  minstefradrag,
  tolkTabell,
  trinnskatt,
  trygdeavgift,
} from './taxCalculator.js';

describe('lønn', () => {
  it('månedslønn og årslønn er det du faktisk tjener, uansett stilling', () => {
    expect(aarslonnFraBelop(10_000, 'maaned', 30)).toBe(120_000);
    expect(aarslonnFraBelop(600_000, 'aar', 80)).toBe(600_000);
  });

  it('timelønn ganges med timene i stillingen', () => {
    expect(aarslonnFraBelop(300, 'time', 100, '37.5')).toBe(585_000);
    expect(aarslonnFraBelop(300, 'time', 100, '35.5')).toBe(553_800);
    expect(aarslonnFraBelop(300, 'time', 50, '37.5')).toBe(292_500);
  });

  it('konverterer mellom faner uten å endre årslønna', () => {
    expect(konverterBelop(600_000, 'aar', 'maaned')).toBe(50_000);
    expect(konverterBelop(50_000, 'maaned', 'time', 100, '37.5')).toBeCloseTo(307.69, 2);
    // 10 000 kr/mnd i 30 % stilling = 120 000 / 585 timer
    expect(konverterBelop(10_000, 'maaned', 'time', 30, '37.5')).toBeCloseTo(205.13, 2);
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

  it('trinn 5 (17,8 % over 1 467 200 kr) er med: fasit for 2,5 mill. kr', () => {
    // Regnet for hånd, trinn for trinn:
    // 1 567,40 + 16 270,00 + 34 941,85 + 81 832,80 + 183 838,40
    expect(trinnskatt(2_500_000)).toBeCloseTo(318_450.45, 2);
    // Hele skatten: 22 % av (2 500 000 − 95 700 − 114 540) + 7,6 % trygdeavgift + trinnskatt
    expect(beregnSkatt({ personinntekt: 2_500_000 }).total).toBeCloseTo(1_012_197.65, 2);
    expect(trinnskatt(1_467_200) + 1_000 * 0.178).toBeCloseTo(trinnskatt(1_468_200), 5);
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

  it('rentefradraget gir mer utbetalt i en vanlig måned bare i smart-modus', () => {
    const smart = beregn({ ...grunn, gjeld: 2_000_000, rente: 5 });
    expect(smart.fradrag.rentebesparelseMaaned).toBeCloseTo(22_000 / 10.5, 5);
    for (const skattemodus of ['tabell', 'prosent']) {
      const r = beregn({ ...grunn, gjeld: 2_000_000, rente: 5, skattemodus });
      expect(r.fradrag.rentebesparelseMaaned).toBe(0);
    }
    expect(beregn(grunn).fradrag.rentebesparelseMaaned).toBe(0);
  });

  it('rentefradraget gir mer utbetalt i måneden også med uføretrygd (smart)', () => {
    const ufor = { ufore: true, uforetrygd: 339_900, belop: 10_000, stilling: 30 };
    const r = beregn({ ...ufor, gjeld: 2_000_000, rente: 5 });
    const uten = beregn({ ...ufor, gjeld: 0 });
    expect(r.fradrag.rentebesparelseMaaned).toBeCloseTo(
      r.netto.vanligMaaned - uten.netto.vanligMaaned,
      5,
    );
    expect(r.fradrag.rentebesparelseMaaned).toBeGreaterThan(0);
  });

  it('fagforening er begrenset til 8 700 kr', () => {
    const r = beregn({ ...grunn, fagforening: 12_000 });
    expect(r.fradrag.fagforening).toBe(8_700);
  });

  it('reisefradrag trekker fra bunnbeløpet', () => {
    const r = beregn({ ...grunn, reiseKm: 60, reiseDager: 200 });
    expect(r.fradrag.reisefradrag).toBeCloseTo(60 * 200 * 1.9 - 12_000, 5);
  });

  it('tabell 8000 gir penger tilbake ved skatteoppgjøret når rentefradraget er stort', () => {
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

  it('stillingsprosent endrer ikke månedslønna, men timelønna', () => {
    const r = beregn({ ...grunn, belop: 10_000, stilling: 30 });
    expect(r.lonn.maanedslonn).toBe(10_000);
    expect(r.lonn.timelonn).toBeCloseTo(205.13, 2);
  });

  it('fradrag øker netto per måned i smart-modus, men ikke med tabelltrekk', () => {
    const uten = beregn(grunn);
    const smart = beregn({ ...grunn, fagforening: 8_700 });
    const tabell = beregn({ ...grunn, fagforening: 8_700, skattemodus: 'tabell' });
    expect(smart.netto.vanligMaaned - uten.netto.vanligMaaned).toBeCloseTo(
      (8_700 * 0.22) / 10.5,
      5,
    );
    expect(tabell.netto.vanligMaaned).toBeCloseTo(uten.netto.vanligMaaned, 5);
    expect(tabell.oppgjor).toBeCloseTo(8_700 * 0.22, 5);
  });

  it('håndterer null og ugyldige tall uten NaN', () => {
    const r = beregn({ belop: 'abc', gjeld: -5, stilling: 0 });
    expect(r.netto.vanligMaaned).toBe(0);
    expect(r.skatt.effektiv).toBe(0);
    expect(Number.isNaN(r.netto.timelonn)).toBe(false);
  });
});

describe('uføretrygd', () => {
  const G = 134_419;
  const ufor = { ufore: true, uforetrygd: 339_900, ieu: 0, reduksjonsprosent: 66 };

  it('reduseres ikke når arbeidsinntekten er under bunnfradraget (1 G)', () => {
    const u = beregnUfore({ ...ufor, fribelop: '1g' }, 120_000);
    expect(u.bunnfradrag).toBe(G);
    expect(u.reduksjon).toBe(0);
    expect(u.utbetalt).toBe(339_900);
  });

  it('reduseres med reduksjonsprosenten av inntekt over bunnfradraget', () => {
    const u = beregnUfore({ ...ufor, fribelop: '04g' }, 100_000);
    expect(u.bunnfradrag).toBeCloseTo(0.4 * G, 5);
    expect(u.reduksjon).toBeCloseTo((100_000 - 0.4 * G) * 0.66, 5);
  });

  it('reduksjonsprosenten er maks 70 %', () => {
    const u = beregnUfore({ ...ufor, fribelop: '04g', reduksjonsprosent: 90 }, 100_000);
    expect(u.reduksjonsprosent).toBe(70);
  });

  it('IEU legges til bunnfradraget ved gradert uføretrygd', () => {
    const u = beregnUfore({ ...ufor, ieu: 200_000 }, 400_000);
    expect(u.bunnfradrag).toBe(200_000 + G);
    expect(u.reduksjon).toBeCloseTo((400_000 - 200_000 - G) * 0.66, 5);
  });

  it('uføretrygd og lønn skattes samlet', () => {
    const r = beregn({ ...ufor, lonnBasis: 'maaned', belop: 10_000, stilling: 30 });
    expect(r.lonn.personinntekt).toBeCloseTo(r.lonn.arbeidsinntekt + 339_900, 5);
    expect(r.ufore.maaned).toBeCloseTo(339_900 / 12, 5);
    expect(Math.abs(r.oppgjor)).toBeLessThan(1);
  });

  it('Nav: nullskatt på uføretrygd i juni og halv skatt i desember', () => {
    const r = beregn({ ...ufor, lonnBasis: 'maaned', belop: 10_000, stilling: 30 });
    const t = r.trekk;
    expect(t.modus).toBe('ufore');
    expect(t.juni.trekkUfore).toBe(0);
    expect(t.desember.trekkUfore).toBeCloseTo(t.navMaanedlig / 2, 5);
    // Nav trekker skatten på uføretrygden alene over 10,5 måneder
    const skattUfore = beregn({ ...ufor, belop: 0 }).skatt.total;
    expect(t.navMaanedlig * 10.5).toBeCloseTo(skattUfore, 5);
  });

  it('arbeidsgiveren trekker marginalskatten som prosent av all lønn, også i juni og desember', () => {
    const r = beregn({ ...ufor, lonnBasis: 'maaned', belop: 10_000, stilling: 30 });
    const t = r.trekk;
    // 22 % + 7,6 % trygdeavgift + 4 % trinn 2 (minstefradraget er allerede fullt)
    expect(t.arbeidsgiverSats).toBeCloseTo(0.336, 5);
    expect(t.vanligDeler.lonn).toBeCloseTo(10_000 * 0.336, 5);
    expect(t.desember.trekkLonn).toBeCloseTo(10_000 * 0.336, 5);
    const juniLonn = 10_000 - r.lonn.ferietrekk + r.lonn.feriepenger;
    expect(t.juni.trekkLonn).toBeCloseTo(juniLonn * 0.336, 5);
  });

  it('bare uføretrygd (ingen jobb) gir ingen trekk hos arbeidsgiver', () => {
    const r = beregn({ ...ufor, belop: 0 });
    expect(r.trekk.arbeidsgiverSats).toBe(0);
    expect(r.trekk.juni.trekk).toBe(0);
    expect(Math.abs(r.oppgjor)).toBeLessThan(1);
  });

  it('tabellmodus: Nav bruker tabellen på uføretrygden, arbeidsgiveren prosentsatsen', () => {
    const r = beregn({ ...ufor, belop: 10_000, stilling: 30, skattemodus: 'tabell', prosent: 35 });
    expect(r.trekk.arbeidsgiverSats).toBeCloseTo(0.35, 5);
    expect(r.trekk.navMaanedlig * 10.5).toBeCloseTo(
      beregnSkatt({ personinntekt: 339_900 }).total,
      5,
    );
  });

  it('netto per arbeidstime tar hensyn til skatt og redusert uføretrygd', () => {
    const r = beregn({
      ...ufor,
      fribelop: '04g',
      lonnBasis: 'maaned',
      belop: 20_000,
      stilling: 50,
    });
    expect(r.ufore.reduksjon).toBeGreaterThan(0);
    expect(r.netto.jobbGevinst).toBeLessThan(r.lonn.arbeidsinntekt - r.ufore.reduksjon);
    expect(r.netto.perArbeidstime).toBeCloseTo(r.netto.jobbGevinst / r.lonn.betalteTimer, 5);
  });

  it('utbetalingene summerer seg også med uføretrygd', () => {
    for (const skattemodus of ['smart', 'tabell', 'prosent']) {
      const r = beregn({ ...ufor, skattemodus, belop: 15_000, stilling: 40 });
      const brutto =
        11 * (r.lonn.maanedslonn + r.ufore.maaned) + r.trekk.juni.netto + r.trekk.juni.trekk;
      expect(brutto).toBeCloseTo(r.lonn.personinntekt, 5);
    }
  });
});
