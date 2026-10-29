# AGENTS.md – Recipe Blog

## Mission

Build and maintain a static multilingual recipe blog with Astro, React islands, TypeScript, YAML content, optimized images, and GitHub Pages. Follow `ARCHITECTURE.md` as the source of truth and `IMPLEMENTATION_PLAN.md` for delivery sequence.

## Non-negotiable rules

1. Keep the site fully statically generated. Do not introduce a backend, CMS, database, auth, runtime AI, or server-only features.
2. Recipes enter exclusively through version-controlled YAML and local image assets.
3. Keep canonical recipe IDs, ingredient IDs, step IDs, and units language-independent and stable. Never translate IDs.
4. Keep ingredient names in central ingredient records, not copied into recipe cores.
5. Keep recipe prose, slugs, step descriptions, image alt text, and notes in locale files.
6. German is mandatory for recipes; English is optional. Do not publish partial translations or broken hreflang links.
7. Use Astro's image pipeline for local images and validate all referenced files.
8. Perform arithmetic on numeric quantities; localize only when formatting output. Never infer ingredient density or convert grams to milliliters without explicit data.
9. Use React only where interaction is required. Favor accessible, semantic HTML and minimal client JavaScript.
10. Ensure all paths work on GitHub Pages project subpaths and custom-domain root deployments.
11. Validate with Zod plus cross-file checks; invalid content must fail CI rather than silently disappear.
12. Preserve backward compatibility of recipe/ingredient IDs. Any schema migration must include migration of existing content and tests.

## Workflow for implementing features

- Read `ARCHITECTURE.md` and existing tests before editing.
- Work in small, reviewable changes aligned with `IMPLEMENTATION_PLAN.md`.
- Add or update unit tests for scaling, unit formatting, localization, and content validation when changing those behaviors.
- Run lint, Astro typecheck, unit tests, and production build before considering work complete.
- Never commit generated build outputs, secrets, node_modules, or private configuration.
- Explain material architectural deviations in the PR description; do not silently replace the agreed stack.

## Workflow for adding recipes

1. Choose a stable English-like kebab-case technical recipe ID, unique across the repository.
2. Create `src/content/recipes/<id>/recipe.yaml` with numeric quantities, stable ingredient IDs, stable step IDs, and image filenames. Use `amountMax` for ranges ("2–3 EL"), `yieldUnit` when the recipe yields trays, loaf tins or pieces instead of servings, and omit `servings` only when the source gives no yield at all.
3. Add any missing ingredient definitions to `src/content/ingredients/<ingredient-id>.yaml`, including names for every locale in which the recipe will be published. Provide `plural` for countable items and `withUnit` when the form after a unit differs from the plural (e.g. `200 g Hähnchenbrust`).
   New categories or tags go into `src/content/categories.yaml` / `src/content/tags.yaml` with labels for every published locale.
4. Add mandatory `de.yaml`, translating every step and providing localized alt text for all images.
5. Add optional `en.yaml` only if complete. Localized slugs must be unique within their locale.
6. Place image sources under `src/assets/recipes/<id>/`; choose a clear cover and descriptive alt text. Do not assume rights to images from the internet.
7. Run `npm run validate`, `npm test` and `npm run build`. Fix errors before submitting a PR.
8. In the PR summary include the recipe ID, languages, number of images, and any new ingredient IDs.

## Definition of done

- Content schemas and cross-file validation pass.
- Unit tests and build pass.
- Keyboard and mobile behavior verified for changed UI.
- Metadata and language links remain correct.
- No broken links or image references.

## Commands

`npm run lint`, `npm run format:check`, `npm run check`, `npm run validate`, `npm test`, `npm run build`, `npm run test:e2e` (after a build). See README for details.
