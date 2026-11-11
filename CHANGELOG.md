# Endringslogg

Alle viktige endringer i dette prosjektet dokumenteres i denne filen.

Formatet er basert på [Keep a Changelog](https://keepachangelog.com/no/1.0.0/),
og prosjektet følger [Semantic Versioning](https://semver.org/lang/no/).

## [Unreleased]

## [1.3.0] - 2026-11-12

### Lagt til

- «Spørsmål og svar» under kalkulatoren med seks vanlige spørsmål om juni, halv skatt i
  desember, rentefradrag, tabellnummer, uføretrygd og personvern. Tallene i svarene kommer fra
  `satser.js`.
- JSON-LD i `index.html`: `WebApplication` (gratis, `FinanceApplication`) og `FAQPage` med
  nøyaktig samme tekst som vises på siden. Skrives inn av en Vite-plugin ved bygg.
- Statisk innhold i `index.html` (h1, ingress og spørsmål og svar), så søkemotorer ser innholdet
  uten JavaScript.
- Avsnitt «2c. Synlighet på Google (SEO)» i `CLAUDE.md`, søkeord i `README.md` og tester for
  SEO-reglene.

### Endret

- Ny tittel («Lønnskalkulator 2026 – netto lønn og skatt»), beskrivelse og Open Graph-tekst
  med søkeordene, og h1 «Lønnskalkulator 2026».
- Overskriften skalerer med skjermbredden, så den ikke kuttes på 375 px.

## [1.2.0] - 2026-11-11

### Endret

- Uføretrygd og lønn har nå hvert sitt skattetrekk, slik det er i praksis. Nav trekker av
  uføretrygden i 10,5 måneder: nullskatt i juni (uføretrygd har ikke feriepenger) og halv skatt
  i desember. Arbeidsgiveren trekker prosent (bikort) av all lønn, også av feriepengene i juni
  og fullt i desember. Før fikk lønna også nullskatt i juni og halv skatt i desember.
- Årshjulet viser trekket fra Nav og fra arbeidsgiveren på hver sin linje, og skjuler
  lønnslinjene når du bare har uføretrygd.
- «Smart» anbefaler skattekort for uføre med jobb: tabell hos Nav og prosenttrekk hos
  arbeidsgiveren (marginalskatten på lønna).
- Med tabelltrekk og uføretrygd kan du skrive inn prosenttrekket hos arbeidsgiveren.

## [1.1.0] - 2026-11-11

### Lagt til

- Uføretrygd (valgfritt steg B): uføretrygd per år, fribeløp 1 G eller 0,4 G, inntekt etter
  uførhet og reduksjonsprosent (maks 70 %). Viser bunnfradrag, hvor mye du kan tjene før
  trygda reduseres, reduksjonen og utbetalt uføretrygd. Uføretrygden er med i skatten,
  i årshjulet (trekkfri i juni, halvt trekk i desember) og i utregningen.
- Nøkkelkortet «Jobben gir deg / time» for uføre: netto per arbeidstime etter skatt og redusert
  uføretrygd, sammenlignet med å ikke jobbe.
- Forklaring når tabell- eller prosenttrekk er valgt: fradragene endrer ikke månedsutbetalingen,
  men kommer tilbake ved skatteoppgjøret. Netto-kortet viser hvor mye du får tilbake.
- Rentefradraget viser hvor mye mer du får utbetalt per måned i «Smart».
- Timetall og timelønn vises under stillingsprosenten.

### Endret

- Månedslønn og årslønn er nå det du faktisk tjener, ikke lønn ved 100 % stilling.
  Stillingsprosenten brukes bare til timetall og timelønn (10 000 kr/mnd i 30 % = 205 kr/t).
- Fagforening og BSU fylles ut med høyeste fradragsberettigede beløp når de slås på, så
  effekten vises med en gang.
- Reisefradrag forklarer når reisekostnaden er under bunnbeløpet på 12 000 kr.
- Flere hurtigknapper for lave lønner, og stegene heter nå A–D.

## [1.0.0] - 2026-11-10

### Lagt til

- Lønns-, skatte-, gjelds- og feriepengekalkulator i React, Vite, Tailwind CSS og Lucide React.
- Beregningsmotor med skattesatsene for 2026: minstefradrag, personfradrag, 22 % skatt på
  alminnelig inntekt, trygdeavgift med frigrense, trinnskatt, formuesskatt, rentefradrag,
  fagforening, BSU og reisefradrag.
- Tre skattemoduser: smart beregning med anbefalt tabell, tabelltrekk (8000–8400, 9010–9400 og
  7150/7160/7170) og prosenttrekk med frikort.
- Forventet restskatt eller penger tilbake når trekket ikke stemmer med den faktiske skatten.
- Feriepenger for 5 uker, 4 uker + 1 dag og over 60 år, med ferietrekk for fastlønnede.
- Årshjul for vanlig måned, juni og desember, fire nøkkelkort, fordelingsbar og detaljert utregning.
- Personvernbanner. Valgene lagres bare lokalt, og knappen «Slett lokale tall / Nullstill» tømmer dem.
- Mobiloppsett med fast bunnlinje, og to kolonner med fast inputpanel på PC.
- Fontene ligger i bygget, så siden gjør ingen kall til tredjeparter.
- Workflow som tester, bygger og publiserer til `build`-grenen og GitHub Pages.
- Prosjektoppsett med arbeidsregler (`CLAUDE.md`), `.gitignore` og `.gitattributes`.

[Unreleased]: https://github.com/RanheimGeriljaTV/Kraft-Skatt/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/RanheimGeriljaTV/Kraft-Skatt/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/RanheimGeriljaTV/Kraft-Skatt/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/RanheimGeriljaTV/Kraft-Skatt/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/RanheimGeriljaTV/Kraft-Skatt/releases/tag/v1.0.0
