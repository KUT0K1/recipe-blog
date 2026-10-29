import { requiredLocales, type Locale } from "../config/locales";
import type { Ingredient, Recipe, TaxonomyLabels, Translation } from "./schemas";

export interface SourceEntry<T> {
  /** ID derived from the file location (filename or folder name). */
  sourceId: string;
  data: T;
}

export interface TranslationSource {
  /** Recipe folder the translation file lives in. */
  recipeDir: string;
  /** Locale derived from the filename (de.yaml -> de). */
  fileLocale: string;
  data: Translation;
}

export interface ContentInput {
  ingredients: SourceEntry<Ingredient>[];
  recipes: SourceEntry<Recipe>[];
  translations: TranslationSource[];
  categories: SourceEntry<TaxonomyLabels>[];
  tags: SourceEntry<TaxonomyLabels>[];
  /** Available image keys in the form "<recipe-id>/<relative-path>". */
  images: ReadonlySet<string>;
}

export function lineKey(line: { id: string; key?: string }): string {
  return line.key ?? line.id;
}

export function referencedImages(recipe: Recipe): string[] {
  return [
    recipe.images.cover,
    ...recipe.images.gallery,
    ...recipe.steps.flatMap((step) => (step.image ? [step.image] : [])),
  ];
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) (seen.has(value) ? dupes : seen).add(value);
  return [...dupes];
}

function diffKeys(expected: string[], actual: string[]) {
  const exp = new Set(expected);
  const act = new Set(actual);
  return {
    missing: [...exp].filter((key) => !act.has(key)),
    extra: [...act].filter((key) => !exp.has(key)),
  };
}

/**
 * Cross-file checks that Zod schemas cannot express. Returns a list of
 * human-readable errors; an empty list means the content is consistent.
 */
export function validateContent(input: ContentInput): string[] {
  const errors: string[] = [];
  const ingredients = new Map<string, Ingredient>();
  const categories = new Map(input.categories.map((c) => [c.sourceId, c.data]));
  const tags = new Map(input.tags.map((t) => [t.sourceId, t.data]));

  for (const { sourceId, data } of input.ingredients) {
    if (sourceId !== data.id) {
      errors.push(`Ingredient file "${sourceId}.yaml" declares id "${data.id}"; they must match.`);
    }
    if (ingredients.has(data.id)) errors.push(`Duplicate ingredient id "${data.id}".`);
    ingredients.set(data.id, data);
    for (const locale of requiredLocales) {
      if (!data.names[locale]) {
        errors.push(`Ingredient "${data.id}" is missing a name for required locale "${locale}".`);
      }
    }
  }

  const recipes = new Map<string, Recipe>();
  for (const { sourceId, data: recipe } of input.recipes) {
    const where = `Recipe "${sourceId}"`;
    if (sourceId !== recipe.id) {
      errors.push(`${where}: folder name and id "${recipe.id}" must match.`);
    }
    if (recipes.has(recipe.id)) errors.push(`Duplicate recipe id "${recipe.id}".`);
    recipes.set(recipe.id, recipe);

    for (const line of recipe.ingredients) {
      if (!ingredients.has(line.id)) {
        errors.push(`${where}: unknown ingredient id "${line.id}".`);
      }
    }
    for (const key of duplicates(recipe.ingredients.map(lineKey))) {
      errors.push(
        `${where}: ingredient line "${key}" appears more than once; give each line a unique \`key\`.`,
      );
    }
    for (const id of duplicates(recipe.steps.map((s) => s.id))) {
      errors.push(`${where}: duplicate step id "${id}".`);
    }
    if (!categories.has(recipe.category)) {
      errors.push(`${where}: unknown category "${recipe.category}".`);
    }
    for (const tag of recipe.tags) {
      if (!tags.has(tag)) errors.push(`${where}: unknown tag "${tag}".`);
    }

    const coverAndGallery = [recipe.images.cover, ...recipe.images.gallery];
    for (const image of duplicates(coverAndGallery)) {
      errors.push(`${where}: image "${image}" is listed more than once in cover/gallery.`);
    }
    for (const image of new Set(referencedImages(recipe))) {
      if (!input.images.has(`${recipe.id}/${image}`)) {
        errors.push(
          `${where}: image file src/assets/recipes/${recipe.id}/${image} does not exist.`,
        );
      }
    }
  }

  const slugs = new Map<string, string>();
  const translatedLocales = new Map<string, Set<string>>();

  for (const { recipeDir, fileLocale, data: t } of input.translations) {
    const where = `Translation "${recipeDir}/${fileLocale}.yaml"`;
    if (fileLocale !== t.locale) {
      errors.push(`${where}: declares locale "${t.locale}"; filename and locale must match.`);
    }
    const recipe = recipes.get(recipeDir);
    if (!recipe) {
      errors.push(`${where}: no recipe.yaml found in folder "${recipeDir}".`);
      continue;
    }
    const locale = t.locale as Locale;
    const seen = translatedLocales.get(recipe.id) ?? new Set();
    seen.add(locale);
    translatedLocales.set(recipe.id, seen);

    const slugKey = `${locale}/${t.slug}`;
    const owner = slugs.get(slugKey);
    if (owner) {
      errors.push(
        `${where}: slug "${t.slug}" is already used by recipe "${owner}" in "${locale}".`,
      );
    }
    slugs.set(slugKey, recipe.id);

    const steps = diffKeys(
      recipe.steps.map((s) => s.id),
      Object.keys(t.steps),
    );
    for (const id of steps.missing) errors.push(`${where}: missing text for step "${id}".`);
    for (const id of steps.extra) errors.push(`${where}: step "${id}" does not exist in recipe.`);

    const alts = diffKeys(referencedImages(recipe), Object.keys(t.imageAlt));
    for (const img of alts.missing) errors.push(`${where}: missing alt text for image "${img}".`);
    for (const img of alts.extra) errors.push(`${where}: alt text for unknown image "${img}".`);

    const groups = diffKeys(
      recipe.ingredients.flatMap((line) => (line.group ? [line.group] : [])),
      Object.keys(t.ingredientGroups),
    );
    for (const g of groups.missing)
      errors.push(`${where}: missing name for ingredient group "${g}".`);
    for (const g of groups.extra) errors.push(`${where}: ingredient group "${g}" is not used.`);

    const keys = new Set(recipe.ingredients.map(lineKey));
    for (const key of Object.keys(t.ingredientNotes)) {
      if (!keys.has(key)) errors.push(`${where}: note for unknown ingredient line "${key}".`);
    }

    for (const line of recipe.ingredients) {
      const ingredient = ingredients.get(line.id);
      if (ingredient && !ingredient.names[locale]) {
        errors.push(`${where}: ingredient "${line.id}" has no "${locale}" name.`);
      }
    }
    if (categories.get(recipe.category) && !categories.get(recipe.category)?.[locale]) {
      errors.push(`${where}: category "${recipe.category}" has no "${locale}" label.`);
    }
    for (const tag of recipe.tags) {
      if (tags.get(tag) && !tags.get(tag)?.[locale]) {
        errors.push(`${where}: tag "${tag}" has no "${locale}" label.`);
      }
    }
  }

  for (const recipe of recipes.values()) {
    for (const locale of requiredLocales) {
      if (!translatedLocales.get(recipe.id)?.has(locale)) {
        errors.push(`Recipe "${recipe.id}": required translation ${locale}.yaml is missing.`);
      }
    }
  }

  return errors;
}

export class ContentValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Content validation failed:\n  - ${problems.join("\n  - ")}`);
    this.name = "ContentValidationError";
  }
}
