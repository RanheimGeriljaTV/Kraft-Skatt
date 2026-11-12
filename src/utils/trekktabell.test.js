import { describe, expect, it } from 'vitest';
import { alleTabeller, besteTabell, tabelltrekk, tolkTabell } from './trekktabell.js';

describe('tabelltrekk – fasit', () => {
  // Skatteetatens trekk i tabell 8000 for 2026 (månedslønn → trekk). Verdiene er hentet fra
  // kodegjennomgangen i Kraft-Skatt#1, der alle 158 086 radene i Skatteetatens tabellfil er
  // kontrollert mot rutinen. Én av dem (50 000 kr) er også regnet for hånd, se under.
  it.each([
    [20_000, 2_713],
    [35_000, 8_366],
    [50_000, 14_184],
    [75_000, 25_585],
    [120_000, 49_478],
  ])('tabell 8000, %i kr i måneden gir %i kr i trekk', (lonn, trekk) => {
    expect(tabelltrekk('8000', lonn)).toBe(trekk);
  });

  it('50 000 kr i tabell 8000, regnet for hånd steg for steg', () => {
    // Grunnlag 50 000 → 50 050 → × 12,12 = 606 606 kr i årsinntekt.
    // Minstefradraget (40,48 %) når taket på 84 216 kr.
    const alminnelig = 606_606 - 84_216 - 114_540; // 407 850
    const kommune = Math.round((alminnelig * 13.75) / 100); // 56 079
    const felles = Math.round((alminnelig * 8.25) / 100); // 33 648
    const trinn = Math.round(92_200 * 0.017 + (606_606 - 318_300) * 0.04); // 13 100
    const trygd = Math.round((606_606 * 7.6) / 100); // 46 102
    expect(kommune + felles + trinn + trygd).toBe(148_929);
    expect(Math.round(148_929 / 10.5)).toBe(14_184);
  });

  it('spesialtabellene, regnet for hånd (50 000 kr, årsinntekt 600 600 kr)', () => {
    // 7160: ingen trygdeavgift, 12 måneder: (55 254 + 33 152 + 12 859) / 12 = 8 438,75
    expect(tabelltrekk('7160', 50_000)).toBe(8_439);
    // 7170: samme skatt, men fordelt på 10,5 måneder: 101 265 / 10,5 = 9 644,3
    expect(tabelltrekk('7170', 50_000)).toBe(9_644);
    // 7150: som 7160, men med 7,6 % trygdeavgift (45 646): 146 911 / 12 = 12 242,6
    expect(tabelltrekk('7150', 50_000)).toBe(12_243);
  });

  it('trygdeavgiftens opptrapping og avrunding opp ved halve kroner', () => {
    // 9 000 kr → 9 050 × 12 = 108 600 kr. Under innslaget (143 175 kr): (108 600 − 99 650) × 25 %
    // = 2 237,5 → 2 238 kr. 2 238 / 12 = 186,5 → 187 kr.
    expect(tabelltrekk('7150', 9_000)).toBe(187);
  });
});

describe('tabelltrekk – egenskaper', () => {
  it('trekkgrunnlaget rundes ned til hele 100 kr', () => {
    expect(tabelltrekk('8000', 50_000)).toBe(tabelltrekk('8000', 50_099));
    expect(tabelltrekk('8000', 50_100)).toBeGreaterThan(tabelltrekk('8000', 50_099));
  });

  it('høyere fradrag gir lavere trekk, og tillegg (9xxx) gir høyere', () => {
    const t = (nr) => tabelltrekk(nr, 50_000);
    expect(t('8000')).toBeGreaterThan(t('8050'));
    expect(t('8050')).toBeGreaterThan(t('8100'));
    expect(t('9050')).toBeGreaterThan(t('8000'));
    expect(t('9400')).toBeGreaterThan(t('9050'));
  });

  it('gir 0 uten utbetaling, og aldri mer enn utbetalingen', () => {
    expect(tabelltrekk('8000', 0)).toBe(0);
    expect(tabelltrekk('8000', -500)).toBe(0);
    expect(tabelltrekk('8000', Number.NaN)).toBe(0);
    for (const nr of alleTabeller()) {
      for (const lonn of [1_000, 20_000, 80_000, 500_000]) {
        const t = tabelltrekk(nr, lonn);
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThanOrEqual(lonn);
      }
    }
  });

  it('lav lønn under frigrensen for trygdeavgift gir 0 i trekk', () => {
    expect(tabelltrekk('8000', 8_000)).toBe(0);
  });

  it('trekket vokser jevnt med lønna', () => {
    let forrige = 0;
    for (let lonn = 0; lonn <= 300_000; lonn += 500) {
      const t = tabelltrekk('8000', lonn);
      expect(t).toBeGreaterThanOrEqual(forrige - 1);
      forrige = t;
    }
  });
});

describe('tolkTabell og alleTabeller', () => {
  it('tolker 8000-, 9000- og spesialtabeller', () => {
    expect(tolkTabell('8050')).toMatchObject({
      gyldig: true,
      fradrag: 50_000,
      maaneder: 10.5,
      trygd: 'hoy',
    });
    expect(tolkTabell('9120')).toMatchObject({ gyldig: true, tillegg: 120_000, fradrag: 0 });
    expect(tolkTabell('7150')).toMatchObject({ gyldig: true, maaneder: 12, trygd: 'hoy' });
    expect(tolkTabell('7160')).toMatchObject({ maaneder: 12, trygd: 'ingen' });
    expect(tolkTabell('7170')).toMatchObject({ maaneder: 10.5, trygd: 'ingen' });
  });

  it('avviser ukjente nummer, men regner dem som 8000', () => {
    for (const nr of ['7100', '8005', '9000', '1234', '', 'abc']) {
      expect(tolkTabell(nr).gyldig).toBe(false);
    }
    expect(tabelltrekk('7100', 50_000)).toBe(tabelltrekk('8000', 50_000));
  });

  it('har 41 + 40 + 3 tabeller', () => {
    expect(alleTabeller()).toHaveLength(84);
    expect(new Set(alleTabeller()).size).toBe(84);
  });
});

describe('besteTabell', () => {
  it('velger tabellen som treffer målet best', () => {
    // Samlet trekk over året for en lønn på 50 000 kr i måneden.
    const aar = (nr) => {
      const m = tabelltrekk(nr, 50_000);
      return m * 10 + Math.round(m / 2);
    };
    const mal = 140_000;
    const beste = besteTabell(mal, aar);
    for (const nr of alleTabeller().filter((t) => !['7150', '7160', '7170'].includes(t))) {
      expect(Math.abs(aar(beste) - mal)).toBeLessThanOrEqual(Math.abs(aar(nr) - mal));
    }
  });

  it('velger 8000 når alt gir 0 i trekk og målet er 0', () => {
    expect(besteTabell(0, () => 0)).toBe('8000');
  });
});
