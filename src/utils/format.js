const heltall = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });

/** 650000 → «650 000 kr» */
export function kr(n) {
  const v = Number.isFinite(n) ? Math.round(n) : 0;
  return `${heltall.format(v === 0 ? 0 : v)} kr`;
}

/** 650000 → «650 000» */
export function tall(n, desimaler = 0) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: desimaler,
  });
}

/** 0.2834 → «28,3 %» */
export function prosent(andel, desimaler = 1) {
  const v = Number.isFinite(andel) ? andel * 100 : 0;
  return `${v.toLocaleString('nb-NO', {
    minimumFractionDigits: desimaler,
    maximumFractionDigits: desimaler,
  })} %`;
}

/** Skattesats uten unødvendige desimaler: 0.22 → «22 %», 0.076 → «7,6 %» */
export function sats(andel) {
  const v = Math.round(andel * 1000) / 10;
  return prosent(andel, Number.isInteger(v) ? 0 : 1);
}

/**
 * Tolker tallinput fra brukeren. Godtar «1 250 000», «1.250.000», «1,250,000», «600 000 kr»,
 * «5,5» og «5.5». Returnerer ett av:
 *   { tom: true }        feltet er tomt
 *   { verdi: number }    gyldig tall
 *   { feil: string }     kunne ikke tolkes (aldri NaN og aldri stille avvisning)
 *
 * Tusenskille (punktum eller komma) godtas når det står i grupper på tre sifre. Med
 * `desimaler: 0` leses «1.250» som 1250. Felt med desimaler leser «1.250» som 1,25, mens
 * «1.250.000» og «1.250,50» alltid leses med punktum som tusenskille.
 */
export function tolkInput(tekst, { desimaler = 0 } = {}) {
  const renset = String(tekst)
    .replace(/\s/g, '') // \s dekker også hardt mellomrom fra Intl
    .replace(/kr|%/gi, '')
    .replace(/[−–]/g, '-'); // typografisk minus
  if (renset === '') return { tom: true };

  const negativ = renset.startsWith('-');
  const kropp = negativ ? renset.slice(1) : renset;
  let verdi;

  const punktum = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(kropp);
  const komma = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(kropp);
  const flereGrupper = (kropp.match(/[.,]/g) ?? []).length > 1;

  if (/^\d+$/.test(kropp)) {
    verdi = Number(kropp);
  } else if (punktum && (desimaler === 0 || flereGrupper)) {
    verdi = Number(kropp.replace(/\./g, '').replace(',', '.'));
  } else if (komma && (desimaler === 0 || flereGrupper)) {
    verdi = Number(kropp.replace(/,/g, ''));
  } else if (/^\d+[.,]\d+$/.test(kropp)) {
    verdi = Number(kropp.replace(',', '.'));
  } else if (/^\d+[.,]$/.test(kropp)) {
    verdi = Number(kropp.slice(0, -1)); // «5,» midt i skrivingen
  } else {
    return { feil: 'Skriv bare tall, for eksempel 1 250 000.' };
  }

  if (desimaler === 0 && !Number.isInteger(verdi)) {
    return { feil: 'Skriv hele tall uten desimaler.' };
  }
  return { verdi: negativ ? -verdi : verdi };
}
