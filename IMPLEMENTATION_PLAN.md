# Recipe Blog – Implementation Plan for Coding Agents

Execute phases in order. Each phase should be a separate PR when practical. Do not add unrelated features.

## Phase 1 – Scaffold and infrastructure

- Initialize Astro + strict TypeScript + Tailwind + React integration; lock dependencies.
- Configure GitHub Pages site/base through environment/config; support project and root deployments.
- Create responsive shell, navigation, footer, localized UI dictionaries, accessible typography.
- Add basic lint/format, Astro check, Vitest, GitHub Actions PR checks and Pages deploy workflow.
- Document local dev commands and deployment setup in README.
  **Done:** Blank localized pages build and deploy without incorrect base paths.

## Phase 2 – Content schema and validation

- Implement YAML content loaders/collections and Zod schemas for ingredient, recipe core, and translation records.
- Implement cross-file validation for unique IDs, ingredient references, step IDs, slug uniqueness, locale completeness, image references and filename safety.
- Create 1–2 complete sample recipes and centralized ingredients.
- Write unit tests for valid and intentionally invalid fixtures.
  **Done:** Invalid YAML relationships fail the production build and PR workflow.

## Phase 3 – Image pipeline and static recipe pages

- Create a build-time image registry via import.meta.glob and resolve recipe-relative filenames.
- Build localized recipe listing, cards, detail pages, cover/gallery/step image components.
- Use Astro Image/Picture with responsive sizes, lazy-loading except critical cover, localized alt text.
- Implement accessible gallery lightbox or defer lightbox to a clearly marked follow-up if it risks blocking page delivery.
  **Done:** Every sample image is optimized and every referenced asset validated.

## Phase 4 – Ingredient scaling and interactions

- Implement pure serving-scaling function and typed unit registry.
- Implement localized quantity formatting, safe g/kg and ml/l normalization, and handling of null/non-scalable amounts.
- Build React serving control (1–20), ingredient checklist, and copyable ingredient list.
- Write Vitest tests for scaling and formatting edge cases; add Playwright smoke test for serving change.
  **Done:** Scaling is deterministic and correct in both languages.

## Phase 5 – Discovery, SEO, polish

- Build localized search and category/tag filters over static data.
- Add SEO title/description/canonical/hreflang, sitemap, Open Graph, and JSON-LD Recipe.
- Add accessible 404, mobile layout polish, image gallery UX, and keyboard audits.
- Verify GitHub Pages subpath build, root/custom-domain build, and locale switching.
  **Done:** MVP acceptance criteria in ARCHITECTURE.md are met.

## Agent prompt for first implementation task

> Implement Phase 1 of IMPLEMENTATION_PLAN.md in this repository. Read and obey AGENTS.md and ARCHITECTURE.md. Use current compatible stable versions of Astro, React, TypeScript, and Tailwind. Configure a fully static GitHub Pages deployment supporting both repository subpaths and custom-domain root paths. Include PR validation and deployment workflows, localized DE/EN shell pages, a README with setup instructions, and a production build check. Do not implement recipe data or interactive calculators yet. Report files changed, commands run, and any assumptions.
