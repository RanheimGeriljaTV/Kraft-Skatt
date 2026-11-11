// Søkemotorinnhold som Vite skriver rett inn i index.html ved bygg (se vite.config.js),
// slik at Google ser tittel, tekst og strukturerte data uten å kjøre JavaScript.

import { SPORSMAL } from './sporsmal.js';

export const SIDE_URL = 'https://ranheimkraft.no/skatt/';
export const APP_NAVN = 'Lønnskalkulator 2026 – Ranheim Kraft';

const escHtml = (t) =>
  String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// JSON i <script> må ikke kunne avslutte taggen.
const escJson = (data) => JSON.stringify(data, null, 2).replace(/</g, '\\u003c');

/** Henter meta-beskrivelsen fra index.html, så den bare står ett sted. */
export function hentBeskrivelse(html) {
  const treff = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  return treff ? treff[1].replace(/\s+/g, ' ').trim() : '';
}

export function jsonLd(beskrivelse) {
  const app = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: APP_NAVN,
    url: SIDE_URL,
    description: beskrivelse,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    inLanguage: 'nb',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'nb',
    mainEntity: SPORSMAL.map(({ sporsmal, svar }) => ({
      '@type': 'Question',
      name: sporsmal,
      acceptedAnswer: { '@type': 'Answer', text: svar },
    })),
  };
  return [app, faq]
    .map((d) => `<script type="application/ld+json">\n${escJson(d)}\n</script>`)
    .join('\n    ');
}

/** Spørsmål og svar som ren HTML i #root. React erstatter det når appen starter. */
export function statiskSporsmal() {
  return SPORSMAL.map(
    ({ sporsmal, svar }) => `<h3>${escHtml(sporsmal)}</h3>\n        <p>${escHtml(svar)}</p>`,
  ).join('\n        ');
}
