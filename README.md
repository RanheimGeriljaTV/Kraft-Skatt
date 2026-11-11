# Kraft Lønn og Skatt

Lønns-, skatte-, gjelds- og feriepengekalkulator for ranheimkraft.no. Viser hva du faktisk får
utbetalt i en vanlig måned, i juni (feriepenger) og i desember (halv skatt), og hvor mye
gjeldsrentene dine sparer deg i skatt. For deg med uføretrygd viser den hva jobben gir etter
skatt og redusert uføretrygd.

- **Nettside:** <https://ranheimkraft.no/skatt/>
- **Forhåndsvisning:** <https://ranheimgeriljatv.github.io/Kraft-Skatt/>
- **Teknologi:** React 19, Vite, Tailwind CSS 4 og Lucide React (JavaScript)

## Søkeord

Siden skal vinne disse søkene. De brukes i `<title>`, `<h1>`, beskrivelsen og i «Spørsmål og
svar»:

1. lønnskalkulator 2026
2. netto lønn kalkulator
3. feriepenger juni utbetaling
4. halv skatt desember
5. uføretrygd og jobb kalkulator

## Synlighet på Google

- `index.html` har tittel, beskrivelse, canonical (`https://ranheimkraft.no/skatt/`) og Open
  Graph, og et statisk utdrag (h1, ingress og spørsmål og svar) i `#root` som React erstatter.
  Søkemotorer ser altså innholdet uten JavaScript.
- Spørsmål og svar ligger i [`src/data/sporsmal.js`](src/data/sporsmal.js). Samme tekst vises
  under kalkulatoren og legges i JSON-LD (`WebApplication` og `FAQPage`) av en liten Vite-plugin
  i `vite.config.js` ([`src/data/seo.js`](src/data/seo.js)). Tallene i svarene kommer fra
  `satser.js`.
- `src/data/seo.test.js` sjekker lengden på tittel og beskrivelse, canonical, Open Graph, én h1
  og at FAQ-teksten i JSON-LD er lik den som vises.

## Personvern

Alt regnes ut i nettleseren. Appen gjør ingen API-kall, og fontene ligger i bygget, så ingen
tall om lønn eller gjeld forlater enheten. Valgene huskes i `localStorage` (nøkkel
`kraft-skatt:valg:v1`), men bare etter at brukeren har endret noe. «Slett lokale tall /
Nullstill» tømmer lagringen og setter alle felter tilbake.

## Funksjoner

- **Lønn:** timelønn, månedslønn eller årslønn (omregnes når du bytter fane), stillingsprosent,
  arbeidsuke (37,5 eller 35,5 t) og fastlønn eller timelønn. Månedslønn og årslønn er det du
  faktisk tjener. Stillingsprosenten gir antall timer og dermed timelønna.
- **Uføretrygd (valgfritt):** uføretrygd per år, fribeløp (1 G eller 0,4 G), inntekt etter
  uførhet og reduksjonsprosent. Viser bunnfradrag, hvor mye du kan tjene før trygda reduseres,
  reduksjonen, og hva du sitter igjen med per arbeidstime.
- **Gjeld og fradrag:** gjeld og rente med utregnet rentefradrag (22 %), fagforeningskontingent,
  BSU, reisefradrag og formuesskatt. I «Smart» øker fradragene netto per måned. Med tabell- eller
  prosenttrekk står trekket fast, og fradragene kommer som penger tilbake ved skatteoppgjøret.
- **Skattetrekk:** smart beregning med anbefalt tabell, tabelltrekk (8000–8400, 9010–9400,
  7150/7160/7170) eller prosenttrekk med frikort. Viser forventet restskatt eller penger
  tilbake når trekket ikke stemmer med den faktiske skatten.
- **Ferie:** 5 uker (12 %), 4 uker + 1 dag (10,2 %) eller over 60 år (+2,3 % opptil 6 G).
- **Resultat:** fire nøkkelkort, fordelingsbar, årshjul (vanlig måned, juni og desember) og
  en detaljert utregning.
- **Mobil:** stablet oppsett med fast bunnlinje som viser netto per måned og effektiv skatt.

## Skattemodellen (2026)

Alle satser ligger i [`src/utils/satser.js`](src/utils/satser.js), og selve motoren i
[`src/utils/taxCalculator.js`](src/utils/taxCalculator.js).

| Del                         | Regel                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Personinntekt               | Lønn minus ferietrekk, pluss feriepenger                                                                        |
| Minstefradrag               | 46 %, maks 95 700 kr                                                                                            |
| Personfradrag               | 114 540 kr                                                                                                      |
| Skatt på alminnelig inntekt | 22 % av personinntekt minus fradrag                                                                             |
| Trygdeavgift                | 7,6 % (ingen under 99 650 kr, deretter opptrapping på 25 %)                                                     |
| Trinnskatt                  | 1,7 / 4,0 / 13,7 / 16,8 / 17,8 % fra 226 100 / 318 300 / 725 050 / 980 100 / 1 467 200 kr                       |
| Formuesskatt                | 1,0 % over 1 900 000 kr (1,1 % over 21,5 mill.)                                                                 |
| Fagforening                 | Fradrag opptil 8 700 kr                                                                                         |
| BSU                         | 10 % skattefradrag av opptil 27 500 kr                                                                          |
| Reisefradrag                | 1,90 kr/km, minus 12 000 kr                                                                                     |
| Trekk                       | Årsskatt / 10,5 måneder: juni trekkfri, halv skatt i desember                                                   |
| Ferietrekk (fastlønn)       | Virkedager / 26 av månedslønna (5 uker = 30/26)                                                                 |
| Feriepenger                 | 12 % / 10,2 % av lønna (etter ferietrekk), +2,3 % over 60 år opptil 6 G                                         |
| Uføretrygd                  | Skattes som lønn. Nav: nullskatt i juni, halv skatt i desember. Arbeidsgiver: prosenttrekk (bikort) av all lønn |
| Bunnfradrag (uføre)         | Inntekt etter uførhet + fribeløp (1 G etter 2 år, ellers 0,4 G; snitt-G 2026 = 134 419 kr)                      |
| Reduksjon (uføre)           | Reduksjonsprosent (maks 70 %) av arbeidsinntekt over bunnfradraget                                              |

Forenklinger: beregningen gjelder en enslig lønnstaker utenfor tiltakssonen, uten
pensjonsinntekt. Tabelltrekket er en tilnærming til Skatteetatens trekktabeller. Feriepengene
regnes av samme års lønn (stabil lønn år til år). Uføreberegningen tar ikke med inntektstak
(80 % av inntekt før uførhet), barnetillegg eller etteroppgjør.

Kilder: [Skattesatser 2026 (regjeringen.no)](https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skattesatser-2026/id3121978/)
[tabelltrinn fra 2025 (Skatteetaten)](https://www.skatteetaten.no/nn/bedrift-og-organisasjon/arbeidsgiver/skattekort-og-skattetrekk/utfore-forskotstrekk/oversikt-over-tabelltrinnene-for-trekktabeller-fra-og-med-2025/),
[Regelendringer for uføretrygd i 2026 (Nav)](https://www.nav.no/regelendring-uforetrygd),
[Uføretrygd og skatt (Skatteetaten)](https://www.skatteetaten.no/nn/person/skatt/hjelp-til-rett-skatt/arbeid-trygd-og-pensjon/pensjon-og-uforetrygd/uforetrygd/uforetrygd-og-skatt/)
og [skattetrekk i juni og desember (Nav)](https://www.nav.no/skattetrekk).

## Utvikling

```powershell
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest
npm run lint         # ESLint
npm run format       # Prettier
npm run build        # bygger til dist/
```

## Filer

| Fil                                | Hva den gjør                                                       |
| ---------------------------------- | ------------------------------------------------------------------ |
| `src/utils/taxCalculator.js`       | Beregningsmotor (lønn, skatt, tabelltrekk, feriepenger)            |
| `src/utils/satser.js`              | Alle skattesatser for inntektsåret                                 |
| `src/hooks/useLagredeValg.js`      | Lagring i `localStorage` og nullstilling                           |
| `src/components/PrivacyBanner.jsx` | Personvernboksen med nullstill-knapp                               |
| `src/components/InputPanel.jsx`    | Steg A–D: lønn, uføretrygd, gjeld og fradrag, skattetrekk og ferie |
| `src/components/SummaryCards.jsx`  | Fire nøkkelkort og fordelingsbar                                   |
| `src/components/YearlyPayouts.jsx` | Årshjulet: vanlig måned, juni og desember                          |
| `src/components/TaxBreakdown.jsx`  | Utregningen steg for steg                                          |
| `src/components/MobileBar.jsx`     | Fast bunnlinje på mobil                                            |
| `src/components/Sporsmal.jsx`      | «Spørsmål og svar» under kalkulatoren                              |
| `src/data/sporsmal.js`             | Spørsmålene og svarene (felles for side og JSON-LD)                |
| `src/data/seo.js`                  | JSON-LD og statisk innhold som skrives inn i index.html            |

## Publisering

Workflowen [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) kjører formatering,
lint, tester og bygg på hver push til `main`. Deretter:

- pushes `dist/` til grenen `build`, som synk-skriptet på ranheimkraft.no kopierer til `/skatt/`,
- publiseres samme bygg på GitHub Pages som forhåndsvisning.

`vite.config.js` bruker `base: './'`, så bygget virker på begge adressene.
