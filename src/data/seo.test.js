// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { hentBeskrivelse, jsonLd, statiskSporsmal, SIDE_URL } from './seo.js';
import { SPORSMAL } from './sporsmal.js';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

const lesJsonLd = (tekst) =>
  [...tekst.matchAll(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g)].map((m) =>
    JSON.parse(m[1]),
  );

describe('SEO i index.html', () => {
  it('har tittel på maks ca. 60 tegn som slutter med «| Ranheim Kraft»', () => {
    const tittel = html.match(/<title>(.*)<\/title>/)[1];
    expect(tittel.length).toBeLessThanOrEqual(60);
    expect(tittel).toMatch(/^Lønnskalkulator .*\| Ranheim Kraft$/);
  });

  it('har beskrivelse på 120–155 tegn som sier at det er gratis', () => {
    const beskrivelse = hentBeskrivelse(html);
    expect(beskrivelse.length).toBeGreaterThanOrEqual(120);
    expect(beskrivelse.length).toBeLessThanOrEqual(155);
    expect(beskrivelse).toMatch(/[Gg]ratis/);
  });

  it('har canonical med avsluttende skråstrek, lang="no" og Open Graph', () => {
    expect(html).toContain(`<link rel="canonical" href="${SIDE_URL}" />`);
    expect(SIDE_URL.endsWith('/')).toBe(true);
    expect(html).toContain('<html lang="no">');
    for (const egenskap of ['title', 'description', 'url', 'type', 'locale', 'image']) {
      expect(html).toContain(`property="og:${egenskap}"`);
    }
  });

  it('har én h1 og spørsmålene i HTML-en før JavaScript', () => {
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).toContain('<!--seo:sporsmal-->');
    expect(statiskSporsmal()).toContain(SPORSMAL[0].sporsmal);
  });
});

describe('JSON-LD', () => {
  const data = lesJsonLd(jsonLd(hentBeskrivelse(html)));
  const app = data.find((d) => d['@type'] === 'WebApplication');
  const faq = data.find((d) => d['@type'] === 'FAQPage');

  it('beskriver en gratis WebApplication på norsk', () => {
    expect(app).toMatchObject({
      url: SIDE_URL,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      inLanguage: 'nb',
      offers: { price: '0', priceCurrency: 'NOK' },
    });
    expect(app.description).toBe(hentBeskrivelse(html));
  });

  it('FAQPage har nøyaktig samme spørsmål og svar som vises på siden', () => {
    expect(faq.mainEntity).toHaveLength(SPORSMAL.length);
    faq.mainEntity.forEach((q, i) => {
      expect(q.name).toBe(SPORSMAL[i].sporsmal);
      expect(q.acceptedAnswer.text).toBe(SPORSMAL[i].svar);
    });
  });

  it('har 3–6 spørsmål med svar på 1–3 setninger', () => {
    expect(SPORSMAL.length).toBeGreaterThanOrEqual(3);
    expect(SPORSMAL.length).toBeLessThanOrEqual(6);
    for (const { svar } of SPORSMAL) {
      const setninger = svar.split(/(?<=[.!?])\s+(?=[A-ZÆØÅ])/).length;
      expect(setninger).toBeLessThanOrEqual(3);
    }
  });
});
