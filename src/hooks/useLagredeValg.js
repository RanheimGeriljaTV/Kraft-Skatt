import { useCallback, useEffect, useRef, useState } from 'react';
import { STANDARDVALG } from '../utils/taxCalculator.js';
import { rensValg } from '../utils/valg.js';

export const LAGRINGSNOKKEL = 'kraft-skatt:valg:v1';

// Leser lagrede valg. Hvert felt sjekkes mot gyldige verdier (se rensValg).
function lesLagret() {
  try {
    const raa = localStorage.getItem(LAGRINGSNOKKEL);
    if (!raa) return { valg: STANDARDVALG, fantes: false };
    return { valg: rensValg(JSON.parse(raa)), fantes: true };
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
