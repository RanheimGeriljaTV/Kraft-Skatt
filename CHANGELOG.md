# Endringslogg

Alle viktige endringer i dette prosjektet dokumenteres i denne filen.

Formatet er basert på [Keep a Changelog](https://keepachangelog.com/no/1.0.0/),
og prosjektet følger [Semantic Versioning](https://semver.org/lang/no/).

## [Unreleased]

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

[Unreleased]: https://github.com/RanheimGeriljaTV/Kraft-Skatt/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/RanheimGeriljaTV/Kraft-Skatt/releases/tag/v1.0.0
