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

/** Tolker norsk tallinput: «1 250 000», «5,5», «5.5» → tall (NaN ved tomt felt). */
export function tolkTall(tekst) {
  const renset = String(tekst)
    .replace(/\s/g, '') // \s dekker også hardt mellomrom fra Intl
    .replace(/kr|%/gi, '')
    .replace(',', '.');
  if (renset === '' || renset === '.') return NaN;
  return Number(renset);
}
