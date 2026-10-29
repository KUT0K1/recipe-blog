# Recipe Blog – Technical Architecture

## 1. Goal and scope

A static, accessible, multilingual recipe website deployed to GitHub Pages. Content is maintained exclusively through Git and reviewed pull requests; no CMS, runtime API, database, authentication, or server-side rendering.

### MVP

- Responsive home page, searchable/filterable recipe index, and localized recipe detail pages.
- German (`de`) default and optional English (`en`) translations; more locales configurable.
- Serving adjustment with deterministic ingredient scaling; ingredient checkboxes.
- One cover image and zero or more gallery/step images per recipe, optimized at build time.
- SEO metadata, JSON-LD Recipe, sitemap, canonical URLs, valid hreflang links, accessible controls.
- Automated validation, tests, preview build on PR, and GitHub Pages deployment on main.

### Not in MVP

User accounts, cloud-synced favorites, shopping-list aggregation, arbitrary mass-volume conversions, AI-generated content at runtime, or browser-based recipe editing.

## 2. Stack

- Astro (current stable compatible version), TypeScript strict, Astro content collections with glob loaders and Zod.
- React only for interactive islands; prefer static Astro components for all other UI.
- Tailwind CSS using the official Astro-compatible integration/version.
- YAML files for structured recipe and ingredient content.
- Vitest for pure logic, Playwright for a small number of browser flows.
- GitHub Actions + GitHub Pages static deployment.
- Pin dependency versions via lockfile and use maintained GitHub Actions major versions or immutable SHAs.

## 3. Content organization

```text
src/
  assets/recipes/<recipe-id>/*.{jpg,jpeg,png,webp,avif}
  content/
    ingredients/<ingredient-id>.yaml
    recipes/<recipe-id>/recipe.yaml
    recipes/<recipe-id>/de.yaml
    recipes/<recipe-id>/en.yaml
  components/
    RecipeCard.astro
    RecipeGallery.astro
    RecipeIngredients.tsx
  lib/
    content-validation.ts
    image-registry.ts
    recipes.ts
    scaling.ts
    units.ts
    i18n.ts
    seo.ts
  pages/
    index.astro
    [lang]/index.astro
    [lang]/recipes/index.astro
    [lang]/recipes/[slug].astro
  content.config.ts
  config/locales.ts
.github/workflows/validate.yml
.github/workflows/deploy.yml
AGENTS.md
ARCHITECTURE.md
IMPLEMENTATION_PLAN.md
```

Content collection loaders can ingest nested YAML files; use separate collections or loaders for recipe cores, translations, and ingredients. Confirm collection entry IDs are stable and unique. Do not rely on folder naming to resolve image imports at runtime.

## 4. Canonical data model

### Ingredient: `src/content/ingredients/potato.yaml`

```yaml
id: potato
category: vegetables
names:
  de: { singular: Kartoffel, plural: Kartoffeln }
  en: { singular: potato, plural: potatoes }
defaultUnit: g
```

- `id` is immutable and unique; the filename must match it.
- Ingredient names are localized centrally, not duplicated in each recipe.
- Optional future attributes (density, allergens) are not required in MVP.

### Recipe core: `src/content/recipes/chicken-potato-gratin/recipe.yaml`

```yaml
id: chicken-potato-gratin
servings: 2
category: main-dishes
tags: [casserole, chicken, potato]
time:
  preparationMinutes: 15
  cookingMinutes: 30
images:
  cover: cover.webp
  gallery: [preparation.webp, finished.webp]
ingredients:
  - id: potato
    amount: 400
    unit: g
  - id: chicken-breast
    amount: 250
    unit: g
  - id: cream
    amount: 150
    unit: ml
  - id: garlic
    amount: 1
    unit: piece
  - id: salt
    amount: null
    unit: null
    scalable: false
steps:
  - id: prepare-potatoes
  - id: sear-chicken
  - id: assemble
    image: preparation.webp
  - id: bake
    durationMinutes: 30
    temperatureCelsius: 180
```

- Recipe `id` is immutable; the folder must match it.
- Recipe core owns quantities, ingredient references, timing, image references, and ordered step IDs.
- `amount` must be finite, positive, and numeric, or null for 'to taste'. `unit` must be null iff amount is null.
- Default `scalable: true` for numeric amounts; false leaves amounts unchanged.
- A unit such as `piece` is not automatically convertible to grams.
- Image names are paths relative to `src/assets/recipes/<recipe-id>/`; forbid traversal (`..`), absolute URLs and external paths.
- Cover is required; gallery and step images optional. No fixed image-count limit.

### German translation: `src/content/recipes/chicken-potato-gratin/de.yaml`

```yaml
locale: de
slug: haehnchen-kartoffel-gratin
title: Hähnchen-Kartoffel-Gratin
description: Cremiges Kartoffelgratin mit Hähnchen und Käse.
imageAlt:
  cover.webp: Goldbraun überbackenes Hähnchen-Kartoffel-Gratin
  preparation.webp: Zutaten vor dem Backen
  finished.webp: Serviertes Kartoffelgratin
steps:
  prepare-potatoes: Kartoffeln schälen und in Scheiben schneiden.
  sear-chicken: Hähnchen würzen und kurz anbraten.
  assemble: Alles in eine Auflaufform geben.
  bake: Im Ofen goldbraun backen.
ingredientNotes:
  salt: Nach Geschmack
```

- English `en.yaml` follows the same shape with translated strings and slug.
- All core step IDs must be present in each published translation; no orphan step IDs.
- Localized alt text must exist for every referenced image, including step images.
- `ingredientNotes` keys must reference ingredient IDs present in the recipe. If the same ingredient appears twice with different notes, introduce a stable line `key` and index notes by that key instead.
- Every recipe requires `de.yaml`; `en.yaml` optional. Only existing translations produce routes/hreflang.
- Slugs must be unique within each locale and URL-safe; enforce cross-file uniqueness.
- For a localized ingredient name missing from an optional locale, fail the build for a published recipe instead of mixing languages silently.

## 5. Units and scaling

- Unit identifiers: `g`, `kg`, `ml`, `l`, `piece`, `clove`, `tbsp`, `tsp` (extend via typed registry).
- Store amounts as numeric quantities, never as formatted strings or fractions.
- Compute `scaled = baseAmount * targetServings / baseServings` only when `scalable !== false` and amount is not null.
- Use a bounded positive integer serving count in UI (1–20 by default); reject invalid values in logic.
- Format using `Intl.NumberFormat(locale, ...)`, locale-specific unit labels, and explicit sensible precision/rounding rules. Avoid showing `0` for small positive amounts; handle fractions for countable units with a documented display strategy.
- Optional safe unit normalization: `1000 g -> 1 kg`, `1000 ml -> 1 l`; preserve underlying value. Do not convert mass to volume without ingredient-specific density. Do not assume tbsp/tsp volume across locales without defining a measurement system.
- Amount-null ingredients display a localized 'to taste' note without arithmetic.
- Test decimals, non-scalable items, rounding, and missing values.

## 6. Images

- Keep source images in `src/assets/recipes/<recipe-id>/` so Astro can optimize them.
- Build a static registry with `import.meta.glob('/src/assets/recipes/**/*.{jpg,jpeg,png,webp,avif}', { eager: true })` or a compatible typed approach. Resolve YAML-relative filenames to module metadata during build; never interpolate dynamic paths into static imports.
- Validate every referenced image exists; reject path traversal and duplicate cover/gallery entries as appropriate.
- Use Astro `<Picture />` or `<Image />` for responsive widths, dimensions, modern formats, and alt text. Avoid uploading manually generated variants unless necessary.
- Cover: prioritize LCP and eager loading where appropriate. Gallery/step images: lazy-load. Use intrinsic dimensions to prevent layout shift.
- Fullscreen/lightbox must support keyboard navigation, Escape to close, focus management, and reduced-motion preferences.

## 7. Routing and localization

- Default routes: `/de/`, `/de/recipes/`, `/de/recipes/<localized-slug>/` and equivalent `/en/...` for available translations.
- `/` redirects statically or renders a locale landing page linking to `/de/`; do not depend on runtime redirects unsupported by Pages.
- Use Astro `site` and `base` configuration for project Pages (`/<repo>/`) versus custom-domain/root Pages (`/`). All internal URLs, image paths, canonical links, sitemap entries, and language links must honor `base`.
- Generate pages at build time using `getStaticPaths()`.
- UI translations in locale dictionaries; ingredient translations in ingredient data; recipe-specific prose in translation files.
- Locale switch preserves recipe identity, not slug; hide unavailable locales.
- Generate `hreflang` only for real routes and correct canonical URLs. JSON-LD Recipe must use localized title, description, instructions, image URLs and appropriately scaled default quantities; avoid misleading nutrition/reviews.

## 8. Search, filters, and accessibility

- MVP recipe search/filter is client-side over a small static index; no backend. Index contains only published localized recipes.
- Filter by localized title, ingredient names, category and tags; normalize case/diacritics.
- Recipe ingredient checklist state is local component state; optional localStorage persistence can follow.
- Semantic headings, keyboard operability, proper form labels, focus styles, sufficient contrast, alt text, and responsive layouts are required.

## 9. CI/CD and quality gates

PR validation: install dependencies using lockfile, typecheck, content cross-reference validation, unit tests, production build, and optional Playwright smoke test. Validate YAML syntax, IDs, ingredient references, translation completeness, unique slugs, and image paths.

On push to protected `master`: run the same checks, build Astro with the correct `site` and `base`, upload Pages artifact, and deploy using official GitHub Pages Actions. Configure repository Pages source as GitHub Actions, with appropriate `pages: write` and `id-token: write` permissions. Avoid deploying untrusted PR code with write permissions.

## 10. Acceptance criteria

1. A new German recipe committed as YAML + image(s) creates a discoverable detail page after merge.
2. Adding `en.yaml` creates an English route and reciprocal locale links; missing English leaves no broken route.
3. Changing servings 2 -> 4 doubles all scalable numeric ingredients, not 'to taste' or non-scalable entries.
4. Every recipe's cover and gallery/step images are optimized and rendered with localized alt text.
5. Invalid ingredient IDs, missing image files, missing step translations, or duplicate slugs fail CI.
6. Both project-path and root/custom-domain builds generate correct links.
7. No backend, secrets, external database, or browser CMS is required.

## 11. Implementation notes (decisions made during the build)

These refine the spec above; they do not change its intent.

- **Versions:** Astro 7 (content layer with `glob`/`file` loaders, Zod 4 via `astro/zod`), React 19, Tailwind CSS 4 via `@tailwindcss/vite`, TypeScript strict, Vitest, Playwright. Exact versions are pinned in `package.json` and the lockfile.
- **Collections:** `ingredients`, `recipes` (`*/recipe.yaml`), `recipeTranslations` (`*/<locale>.yaml`, ID `<recipe>/<locale>`), `categories` and `tags` (single YAML maps of ID → localized label). Collection IDs are derived from file locations and compared with the IDs inside the files.
- **Validation:** `src/lib/content-validation.ts` holds all cross-file rules as a pure function. It runs (a) during every build via `src/lib/recipes.ts`, throwing `ContentValidationError`, and (b) in `tests/content.test.ts`, which reads the YAML directly from disk (`npm run validate`).
- **Ingredient groups:** recipe lines may carry an optional `group` ID (e.g. `crust`, `filling`); each translation names its groups in `ingredientGroups`. Groups are ordered by first appearance.
- **Ingredient name forms:** `singular`, optional `plural` (default: singular) and optional `withUnit` (default: plural). Bare counts (`piece`) use singular/plural; amounts with a unit and "to taste" use `withUnit`.
- **Units & display:** registry in `src/lib/units.ts`. Metric units: `< 1` two significant digits, `< 10` one decimal, `< 100` integers, `≥ 100` multiples of 5; g/ml switch to kg/l from 1000. `piece`, `clove`, `tbsp`, `tsp`, `pinch` round to quarters and show ¼/½/¾, never rounding a positive amount to zero.
- **Time:** optional `restingMinutes` in addition to preparation and cooking time (e.g. chilling).
- **Translations:** optional `notes` list for tips.
- **Cards:** `RecipeCard.tsx` is rendered statically on the home page (no JS) and reused inside the search island; card images are generated with `getImage()` at build time.
- **Lightbox:** native `<dialog>` with a small vanilla script in `RecipeGallery.astro` (Escape, arrow keys, focus return, reduced motion); without JS thumbnails link to the full image.
- **Root page:** `/` forwards to `/de/` with a meta refresh and lists all locales; it is `noindex` and excluded from the sitemap.
- **404:** one bilingual page, because GitHub Pages serves a single `404.html`.
- **Placeholder images:** until real photos exist, `scripts/placeholder-image.mjs` generates neutral cover images so the "cover required" rule stays enforced.
