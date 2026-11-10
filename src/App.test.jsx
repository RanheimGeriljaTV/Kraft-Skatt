import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App.jsx';
import { LAGRINGSNOKKEL } from './hooks/useLagredeValg.js';
import { STANDARDVALG } from './utils/taxCalculator.js';

// Intl bruker hardt mellomrom som tusenskille. Gjør om til vanlig mellomrom i testene.
const vist = (el) => el.value.replace(/\s/g, ' ');
const lagret = () => JSON.parse(localStorage.getItem(LAGRINGSNOKKEL) ?? 'null');

describe('App', () => {
  it('viser personvernbanneret og lenken tilbake', () => {
    render(<App />);
    expect(screen.getByText(/Alle utregninger skjer kun i din egen nettleser/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ranheim Kraft/ })).toHaveAttribute('href', '../');
  });

  it('lagrer ikke noe før brukeren endrer et valg', () => {
    render(<App />);
    expect(localStorage.getItem(LAGRINGSNOKKEL)).toBeNull();
  });

  it('husker endrede valg lokalt og nullstiller dem', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: /Årslønn/ }));
    expect(lagret()).toMatchObject({ lonnBasis: 'aar', belop: 600_000 });

    fireEvent.click(screen.getByRole('button', { name: /Nullstill/ }));
    expect(localStorage.getItem(LAGRINGSNOKKEL)).toBeNull();
    expect(screen.getByRole('radio', { name: /Månedslønn/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('leser inn lagrede valg ved oppstart og ignorerer feil typer', () => {
    localStorage.setItem(
      LAGRINGSNOKKEL,
      JSON.stringify({ ...STANDARDVALG, lonnBasis: 'time', belop: 'tull' }),
    );
    render(<App />);
    expect(screen.getByRole('radio', { name: 'Timelønn' })).toHaveAttribute('aria-checked', 'true');
    expect(vist(screen.getByLabelText('Timelønn', { selector: 'input' }))).toBe('50 000');
  });

  it('tallfelt godtar norsk formatering', () => {
    render(<App />);
    const felt = screen.getByLabelText(/Total gjeld \(boliglån/);
    fireEvent.focus(felt);
    fireEvent.change(felt, { target: { value: '2 000 000' } });
    fireEvent.blur(felt);
    expect(vist(felt)).toBe('2 000 000');
    expect(screen.getByText(/Årlige renteutgifter/).textContent).toMatch(/22 % rentefradrag/);
    expect(lagret().gjeld).toBe(2_000_000);
  });

  it('fradrag gir høyere netto per måned i smart-modus', () => {
    render(<App />);
    const netto = () => screen.getAllByText(/Netto utbetalt \/ mnd/)[0].parentElement.textContent;
    const for_ = netto();
    fireEvent.click(screen.getByRole('switch', { name: /Fagforeningskontingent/ }));
    expect(lagret().fagforening).toBe(8_700);
    expect(netto()).not.toBe(for_);
  });

  it('forklarer at fradrag ikke endrer månedsutbetalingen med tabelltrekk', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: /Tabell/ }));
    expect(screen.getByText(/fradragene endrer ikke det du får utbetalt/)).toBeInTheDocument();
  });

  it('uføretrygd: viser bunnfradrag og hva jobben gir per time', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('switch', { name: /Jeg mottar uføretrygd/ }));
    expect(lagret()).toMatchObject({ ufore: true, uforetrygd: 339_900 });
    expect(screen.getByText(/Bunnfradrag:/)).toBeInTheDocument();
    expect(screen.getByText(/Jobben gir deg \/ time/)).toBeInTheDocument();
    expect(screen.getAllByText(/Uføretrygd \(Nav\)/)).toHaveLength(3);
  });

  it('viser tabellvelger med 2025-nummerering', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: /Tabell/ }));
    const velger = screen.getByLabelText(/Tabellnummer fra skattekortet/);
    fireEvent.change(velger, { target: { value: '8050' } });
    expect(velger).toHaveValue('8050');
    expect(lagret().tabellnummer).toBe('8050');
  });
});
