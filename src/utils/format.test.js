import { describe, expect, it } from 'vitest';
import { kr, prosent, sats, tolkInput } from './format.js';

const verdi = (tekst, desimaler = 0) => tolkInput(tekst, { desimaler }).verdi;

describe('tolkInput – hele tall', () => {
  it('godtar mellomrom, punktum og komma som tusenskille', () => {
    for (const t of ['1250000', '1 250 000', '1 250 000', '1.250.000', '1,250,000']) {
      expect(verdi(t)).toBe(1_250_000);
    }
  });

  it('leser «1.250» som 1250 og godtar kr og prosent', () => {
    expect(verdi('1.250')).toBe(1250);
    expect(verdi('1,250')).toBe(1250);
    expect(verdi('600 000 kr')).toBe(600_000);
    expect(verdi('1.250.000,00')).toBe(1_250_000);
  });

  it('avviser desimaler, hex og tekst med en tydelig feilmelding', () => {
    expect(tolkInput('1.5').feil).toMatch(/hele tall/);
    expect(tolkInput('5,25').feil).toMatch(/hele tall/);
    expect(tolkInput('12.50').feil).toMatch(/hele tall/);
    for (const t of ['0x10', 'abc', '1e5', '1..5', '12,34,5', 'Infinity', '--5']) {
      expect(tolkInput(t).feil, t).toBeTruthy();
      expect(tolkInput(t).verdi, t).toBeUndefined();
    }
  });

  it('tomt felt er tomt, ikke feil', () => {
    expect(tolkInput('')).toEqual({ tom: true });
    expect(tolkInput('  ')).toEqual({ tom: true });
  });

  it('negative tall tolkes, også med typografisk minus', () => {
    expect(verdi('-500000')).toBe(-500_000);
    expect(verdi('−500000')).toBe(-500_000);
  });

  it('godtar tall midt i skrivingen', () => {
    expect(verdi('1.')).toBe(1);
  });
});

describe('tolkInput – felt med desimaler', () => {
  it('leser komma og punktum som desimaltegn', () => {
    expect(verdi('5,25', 2)).toBe(5.25);
    expect(verdi('5.25', 2)).toBe(5.25);
    expect(verdi('5,', 2)).toBe(5);
    expect(verdi('205.13', 2)).toBe(205.13);
  });

  it('leser «1.250» som 1,25, men «1.250.000» og «1.250,50» med tusenskille', () => {
    expect(verdi('1.250', 2)).toBe(1.25);
    expect(verdi('1.250.000', 2)).toBe(1_250_000);
    expect(verdi('1.250,50', 2)).toBe(1250.5);
    expect(verdi('1,250.50', 2)).toBe(1250.5);
  });

  it('avviser hex og tekst', () => {
    expect(tolkInput('0x10', { desimaler: 2 }).feil).toBeTruthy();
    expect(tolkInput('5,5,5', { desimaler: 2 }).feil).toBeTruthy();
  });
});

describe('formatering', () => {
  it('kr, prosent og sats', () => {
    expect(kr(1_250_000).replace(/\s/g, ' ')).toBe('1 250 000 kr');
    expect(prosent(0.2341)).toBe('23,4 %');
    expect(sats(0.22)).toBe('22 %');
    expect(sats(0.076)).toBe('7,6 %');
  });
});
