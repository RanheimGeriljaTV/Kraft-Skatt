import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App.jsx';
import { LAGRINGSNOKKEL } from './hooks/useLagredeValg.js';
import { STANDARDVALG } from './utils/taxCalculator.js';
import { SPORSMAL } from './data/sporsmal.js';

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

  it('har én h1 med hovedsøkeordet og viser spørsmål og svar', () => {
    render(<App />);
    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(/Lønnskalkulator 2026/);
    expect(screen.getByRole('heading', { name: 'Spørsmål og svar' })).toBeInTheDocument();
    for (const { sporsmal, svar } of SPORSMAL) {
      expect(screen.getByRole('heading', { name: sporsmal })).toBeInTheDocument();
      // Testing Library gjør hardt mellomrom om til vanlig mellomrom i siden, så også her.
      expect(screen.getByText(svar.replace(/\s+/g, ' '))).toBeInTheDocument();
    }
  });

  describe('tallfelt', () => {
    const skriv = (felt, tekst) => {
      fireEvent.focus(felt);
      fireEvent.change(felt, { target: { value: tekst } });
    };
    const aarslonn = () => {
      render(<App />);
      fireEvent.click(screen.getByRole('radio', { name: 'Årslønn' }));
      return screen.getByLabelText('Årslønn', { selector: 'input' });
    };

    it('godtar punktum som tusenskille', () => {
      const felt = aarslonn();
      skriv(felt, '1.250.000');
      expect(felt).not.toHaveAttribute('aria-invalid');
      expect(lagret().belop).toBe(1_250_000);
      fireEvent.blur(felt);
      expect(vist(felt)).toBe('1 250 000');
    });

    it('sier fra når teksten ikke kan leses, og beholder forrige verdi', () => {
      const felt = aarslonn();
      skriv(felt, '1.5');
      expect(felt).toHaveAttribute('aria-invalid', 'true');
      const melding = screen.getByText(/Skriv hele tall uten desimaler/);
      expect(melding.textContent).toMatch(/Beregningen bruker fortsatt 600\s000/);
      expect(felt).toHaveAccessibleDescription(/Skriv hele tall/);
      expect(lagret().belop).toBe(600_000);
      // Meldingen blir stående etter at fokus forlater feltet, og feltet viser gyldig verdi.
      fireEvent.blur(felt);
      expect(vist(felt)).toBe('600 000');
      expect(screen.getByText(/Skriv hele tall uten desimaler/)).toBeInTheDocument();
      // ...og forsvinner når brukeren skriver et gyldig tall.
      skriv(felt, '700000');
      expect(screen.queryByText(/Skriv hele tall uten desimaler/)).not.toBeInTheDocument();
      expect(felt).not.toHaveAttribute('aria-invalid');
    });

    it('forkaster ikke hex-tall i stillhet', () => {
      const felt = aarslonn();
      skriv(felt, '0x10');
      expect(felt).toHaveAttribute('aria-invalid', 'true');
      expect(lagret().belop).toBe(600_000);
    });

    it('melder når verdien klemmes til høyeste eller laveste verdi', () => {
      render(<App />);
      const rente = screen.getByLabelText('Gjennomsnittlig rente');
      skriv(rente, '45');
      expect(screen.getByText(/Høyeste verdi er 30 %/)).toBeInTheDocument();
      expect(rente).not.toHaveAttribute('aria-invalid');
      expect(lagret().rente).toBe(30);
      skriv(rente, '-3');
      expect(screen.getByText(/Laveste verdi er 0 %/)).toBeInTheDocument();
    });
  });

  it('lagrede verdier som ikke gir mening blir renset ved oppstart', () => {
    localStorage.setItem(
      LAGRINGSNOKKEL,
      JSON.stringify({ ...STANDARDVALG, gjeld: 1e20, tabellnummer: '1234', skattemodus: 'tabell' }),
    );
    render(<App />);
    expect(vist(screen.getByLabelText(/Total gjeld \(boliglån/))).toBe('100 000 000');
    expect(screen.getByLabelText(/Tabellnummer fra skattekortet/)).toHaveValue('8000');
    expect(screen.queryByRole('option', { name: /1234/ })).not.toBeInTheDocument();
  });

  describe('faner (radiogrupper)', () => {
    const gruppe = () => screen.getByRole('radiogroup', { name: 'Jeg vet' });

    it('bare valgt fane er et tab-stopp', () => {
      render(<App />);
      const radioer = within(gruppe()).getAllByRole('radio');
      expect(radioer.map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
    });

    it('piltastene flytter fokus og valg, med runding rundt', () => {
      render(<App />);
      const [time, maaned, aar] = within(gruppe()).getAllByRole('radio');
      maaned.focus();
      fireEvent.keyDown(maaned, { key: 'ArrowRight' });
      expect(aar).toHaveAttribute('aria-checked', 'true');
      expect(aar).toHaveFocus();
      expect(lagret().lonnBasis).toBe('aar');
      fireEvent.keyDown(aar, { key: 'ArrowRight' });
      expect(time).toHaveAttribute('aria-checked', 'true');
      expect(time).toHaveFocus();
      fireEvent.keyDown(time, { key: 'ArrowLeft' });
      expect(aar).toHaveFocus();
      fireEvent.keyDown(aar, { key: 'Home' });
      expect(time).toHaveFocus();
      fireEvent.keyDown(time, { key: 'End' });
      expect(aar).toHaveFocus();
      expect(
        within(gruppe())
          .getAllByRole('radio')
          .map((r) => r.tabIndex),
      ).toEqual([-1, -1, 0]);
    });

    it('andre taster gjør ingenting', () => {
      render(<App />);
      const maaned = within(gruppe()).getByRole('radio', { name: 'Månedslønn' });
      fireEvent.keyDown(maaned, { key: 'a' });
      expect(maaned).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('mobilbunnlinjen er en region, ikke en live-region som leses opp ved hvert tastetrykk', () => {
    render(<App />);
    const bunnlinje = screen.getByRole('region', { name: 'Netto utbetalt og effektiv skatt' });
    expect(bunnlinje).not.toHaveAttribute('aria-live');
    expect(bunnlinje.closest('[aria-live]')).toBeNull();
  });

  it('ferieavtalen kan velges, også lovbestemt over 60 år', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: /Over 60, lovbestemt/ }));
    expect(lagret().ferie).toBe('lovOver60');
  });

  it('aria-controls peker bare på et panel som finnes', () => {
    render(<App />);
    const bryter = screen.getByRole('switch', { name: /Fagforeningskontingent/ });
    expect(bryter).not.toHaveAttribute('aria-controls');
    fireEvent.click(bryter);
    const id = bryter.getAttribute('aria-controls');
    expect(id).toBeTruthy();
    expect(document.getElementById(id)).not.toBeNull();
  });
});
