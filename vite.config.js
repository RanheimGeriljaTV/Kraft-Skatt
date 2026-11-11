/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

import { hentBeskrivelse, jsonLd, statiskSporsmal } from './src/data/seo.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Skriver JSON-LD og spørsmål og svar rett inn i index.html, så søkemotorer ser innholdet
// uten JavaScript. Teksten kommer fra src/data/sporsmal.js, samme kilde som appen bruker.
function seo() {
  return {
    name: 'kraft-skatt-seo',
    transformIndexHtml(html) {
      return html
        .replace('<!--seo:jsonld-->', jsonLd(hentBeskrivelse(html)))
        .replace('<!--seo:sporsmal-->', statiskSporsmal());
    },
  };
}

// base: './' gir relative stier, slik at samme bygg virker både på
// ranheimgeriljatv.github.io/Kraft-Skatt/ og på ranheimkraft.no/skatt/.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), seo()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
