import { useCallback, useEffect, useRef, useState } from 'react';
import { STANDARDVALG } from '../utils/taxCalculator.js';

export const LAGRINGSNOKKEL = 'kraft-skatt:valg:v1';

// Leser lagrede valg, men tar bare med kjente felt med riktig type.
function lesLagret() {
  try {
    const raa = localStorage.getItem(LAGRINGSNOKKEL);
    if (!raa) return { valg: STANDARDVALG, fantes: false };
    const data = JSON.parse(raa);
    const valg = { ...STANDARDVALG };
    for (const [nokkel, standard] of Object.entries(STANDARDVALG)) {
      if (data && typeof data[nokkel] === typeof standard) valg[nokkel] = data[nokkel];
    }
    return { valg, fantes: true };
  } catch {
    return { valg: STANDARDVALG, fantes: false };
  }
}

/**
 * Brukerens valg, husket i localStorage på denne enheten.
 * Ingenting lagres før brukeren faktisk endrer noe, og «nullstill» tømmer lagringen helt.
 */
export function useLagredeValg() {
  const [start] = useState(lesLagret);
  const [valg, setValg] = useState(start.valg);
  const [harLagret, setHarLagret] = useState(start.fantes);
  const skalLagre = useRef(false);

  useEffect(() => {
    if (!skalLagre.current) return;
    try {
      localStorage.setItem(LAGRINGSNOKKEL, JSON.stringify(valg));
    } catch {
      // Privat modus eller full lagring: kalkulatoren virker fortsatt, bare uten minne.
    }
  }, [valg]);

  const oppdater = useCallback((endring) => {
    skalLagre.current = true;
    setHarLagret(true);
    setValg((forrige) => ({ ...forrige, ...endring }));
  }, []);

  const nullstill = useCallback(() => {
    skalLagre.current = false;
    try {
      localStorage.removeItem(LAGRINGSNOKKEL);
    } catch {
      // Ignorer: det finnes ingenting å slette.
    }
    setHarLagret(false);
    setValg(STANDARDVALG);
  }, []);

  return { valg, oppdater, nullstill, harLagret };
}
