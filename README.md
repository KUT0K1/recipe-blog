# Rezept-Blog

Statischer, zweisprachiger (DE/EN) Rezept-Blog auf Basis von [Astro](https://astro.build), React-Inseln,
Tailwind CSS und YAML-Inhalten, gehostet auf GitHub Pages.

- Architektur und Datenmodell: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Regeln für Coding-Agents und Rezept-Workflow: [`AGENTS.md`](AGENTS.md)
- Umsetzungsphasen: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)

## Lokale Entwicklung

Voraussetzung: Node.js ≥ 22.12 (siehe `.nvmrc`).

```sh
npm ci             # Abhängigkeiten exakt nach Lockfile installieren
npm run dev        # Dev-Server auf http://localhost:4321/recipe-blog/
npm run build      # Produktions-Build nach dist/
npm run preview    # dist/ lokal ausliefern
```

| Befehl                 | Zweck                                                         |
| ---------------------- | ------------------------------------------------------------- |
| `npm run lint`         | ESLint (TypeScript, Astro, React Hooks)                       |
| `npm run format`       | Prettier schreibt Formatierung                                |
| `npm run format:check` | Prettier prüft Formatierung (CI)                              |
| `npm run check`        | Astro/TypeScript-Typecheck                                    |
| `npm run validate`     | Nur Content-Validierung (Schemas + dateiübergreifende Checks) |
| `npm test`             | Alle Unit-Tests (Vitest) inkl. Content-Validierung            |
| `npm run test:e2e`     | Playwright-Smoke-Tests gegen `dist/` (vorher `npm run build`) |

Für die E2E-Tests lokal einmalig `npx playwright install chromium` ausführen.

## Ein Rezept hinzufügen (Kurzfassung)

```text
src/content/recipes/<rezept-id>/recipe.yaml   # Mengen, Zutaten-IDs, Schritte, Bilder
src/content/recipes/<rezept-id>/de.yaml       # Pflicht: Titel, Slug, Schritttexte, Alt-Texte
src/content/recipes/<rezept-id>/en.yaml       # optional, nur wenn vollständig
src/content/ingredients/<zutat-id>.yaml       # fehlende Zutaten zentral anlegen
src/content/categories.yaml, tags.yaml        # Kategorie- und Tag-Bezeichnungen
src/assets/recipes/<rezept-id>/cover.webp     # Titelbild (Pflicht) + weitere Bilder
```

Danach `npm test && npm run build`. Fehlerhafte Verweise (unbekannte Zutat, fehlendes Bild, fehlende
Schrittübersetzung, doppelter Slug …) brechen Tests und Build mit einer verständlichen Meldung ab.
Details in [`AGENTS.md`](AGENTS.md).

### Bilder

Die beiden vorhandenen Rezepte nutzen derzeit **Platzhalter-Titelbilder**. Zum Ersetzen einfach
`src/assets/recipes/<rezept-id>/cover.webp` durch ein echtes Foto ersetzen (oder ein anderes Format
verwenden und `images.cover` in `recipe.yaml` anpassen) und den Alt-Text in `de.yaml`/`en.yaml`
aktualisieren. Astro erzeugt beim Build automatisch responsive AVIF/WebP/JPEG-Varianten; Quellfotos
mit ca. 2000 px Breite genügen.

Neue Platzhalter: `node scripts/placeholder-image.mjs <rezept-id> [farbton]`.

## Deployment (GitHub Pages)

Der Build ist vollständig statisch. Ziel-URL und Pfad kommen aus Umgebungsvariablen:

| Variable    | Standard                   | Beispiel Custom Domain        |
| ----------- | -------------------------- | ----------------------------- |
| `SITE_URL`  | `https://kut0k1.github.io` | `https://rezepte.example.com` |
| `BASE_PATH` | `/recipe-blog`             | `/`                           |

Im Workflow werden beide Werte automatisch von `actions/configure-pages` gesetzt.

### Einmalige Einrichtung (noch offen)

1. **Settings → Pages → Build and deployment → Source: „GitHub Actions“** auswählen.
   (Der frühere `gh-pages`-Branch wird nicht mehr benötigt und kann danach gelöscht werden.)
2. Optional **Settings → Branches**: Branch-Schutz für `master` mit dem Pflicht-Check
   „Lint, typecheck, tests, build“ aus dem Workflow _Validate_.
3. Optional eigene Domain: unter Settings → Pages eintragen. Der Deploy-Workflow übernimmt Origin und
   leeren Basis-Pfad automatisch; Code-Änderungen sind nicht nötig.

### Workflows

- `.github/workflows/validate.yml` – bei jedem Pull Request: Lint, Format, Content-Validierung,
  Typecheck, Unit-Tests, Build für Root- **und** Projektpfad, Playwright-Smoke-Tests. Nur Leserechte.
- `.github/workflows/deploy.yml` – bei Push auf `master` (oder manuell): dieselben Checks, Build mit
  den Pages-Werten, Upload und Deployment über die offiziellen Pages-Actions.
