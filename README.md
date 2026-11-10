# Kraft Lønn og Skatt

Verktøy for lønn og skatt fra Ranheim Kraft.

- **Nettside:** <https://ranheimkraft.no/skatt/>
- **Forhåndsvisning:** <https://ranheimgeriljatv.github.io/Kraft-Skatt/>
- **Type:** statisk HTML/CSS/JS (ingen byggsteg)

## Filer

| Fil | Hva den gjør |
| --- | --- |
| `index.html` | Selve siden. |
| `css/style.css` | Stiler (mørkt Ranheim Kraft-design, mobil først). |
| `js/app.js` | Logikken. |
| `CLAUDE.md` | Arbeidsregler for prosjektet. |
| `CHANGELOG.md` | Endringslogg (Keep a Changelog + SemVer). |

## Kjøre lokalt

Siden er ren HTML, så du kan åpne `index.html` direkte i nettleseren, eller starte en enkel server:

```powershell
python -m http.server 8000
```

og gå til <http://localhost:8000/>.

## Publisering

`main` publiseres automatisk:

- GitHub Pages viser `main` (rotmappen) på forhåndsvisningsadressen.
- Synk-skriptet i `ranheimkraft.no`-repoet kopierer `main` til `/skatt/` hver 3. time.

Bruk bare relative stier, så siden virker på begge adressene.
