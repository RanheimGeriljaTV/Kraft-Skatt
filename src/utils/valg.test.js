import { describe, expect, it } from 'vitest';
import { rensValg } from './valg.js';
import { STANDARDVALG } from './taxCalculator.js';

describe('rensValg', () => {
  it('gir standardvalg for alt som ikke er et objekt', () => {
    for (const data of [null, undefined, 5, 'tekst', true, [], [1, 2]]) {
      expect(rensValg(data)).toEqual(STANDARDVALG);
    }
  });

  it('beholder gyldige valg', () => {
    const gyldig = {
      ...STANDARDVALG,
      lonnBasis: 'aar',
      belop: 750_000,
      stilling: 80,
      arbeidsuke: '35.5',
      lonnstype: 'time',
      ufore: true,
      uforetrygd: 339_900,
      ieu: 100_000,
      fribelop: '04g',
      reduksjonsprosent: 55,
      gjeld: 2_500_000,
      rente: 4.25,
      fagforening: 5_000,
      bsu: 20_000,
      reiseKm: 40,
      reiseDager: 200,
      formue: 3_000_000,
      skattemodus: 'tabell',
      tabellnummer: '8050',
      prosent: 32.5,
      frikort: true,
      ferie: 'over60',
    };
    expect(rensValg(gyldig)).toEqual(gyldig);
  });

  it('klemmer tall utenfor området i stedet for å vise absurde tekster', () => {
    const r = rensValg({ gjeld: 1e20, rente: 99, stilling: 250, reiseDager: -5, formue: 1e30 });
    expect(r.gjeld).toBe(100_000_000);
    expect(r.rente).toBe(30);
    expect(r.stilling).toBe(100);
    expect(r.reiseDager).toBe(0);
    expect(r.formue).toBe(10_000_000_000);
  });

  it('bruker standardverdi for NaN, uendelig, tekst og null', () => {
    const r = rensValg({ gjeld: Number.NaN, rente: Infinity, belop: '50000', stilling: null });
    expect(r.gjeld).toBe(STANDARDVALG.gjeld);
    expect(r.rente).toBe(STANDARDVALG.rente);
    expect(r.belop).toBe(STANDARDVALG.belop);
    expect(r.stilling).toBe(STANDARDVALG.stilling);
  });

  it('avviser ukjente valg og ugyldige tabellnummer', () => {
    const r = rensValg({
      lonnBasis: 'uke',
      arbeidsuke: '40',
      skattemodus: 'annet',
      ferie: 'seks',
      tabellnummer: '1234',
      lonnstype: 5,
    });
    expect(r.lonnBasis).toBe(STANDARDVALG.lonnBasis);
    expect(r.arbeidsuke).toBe(STANDARDVALG.arbeidsuke);
    expect(r.skattemodus).toBe(STANDARDVALG.skattemodus);
    expect(r.ferie).toBe(STANDARDVALG.ferie);
    expect(r.tabellnummer).toBe(STANDARDVALG.tabellnummer);
    expect(r.lonnstype).toBe(STANDARDVALG.lonnstype);
  });

  it('beløpets tak følger lønnsbasis', () => {
    expect(rensValg({ lonnBasis: 'time', belop: 90_000 }).belop).toBe(5_000);
    expect(rensValg({ lonnBasis: 'maaned', belop: 5_000_000 }).belop).toBe(1_000_000);
    expect(rensValg({ lonnBasis: 'aar', belop: 90_000_000 }).belop).toBe(12_000_000);
  });

  it('godtar alle tabellnummer vi støtter', () => {
    for (const nr of ['8000', '8400', '9010', '9400', '7150', '7160', '7170']) {
      expect(rensValg({ tabellnummer: nr }).tabellnummer).toBe(nr);
    }
  });

  it('droppe ukjente felt og blander ikke inn objektets prototype', () => {
    const r = rensValg({ hacked: true, __proto__: { gjeld: 5 }, constructor: 'x' });
    expect(r).not.toHaveProperty('hacked');
    expect(r.gjeld).toBe(STANDARDVALG.gjeld);
  });
});
