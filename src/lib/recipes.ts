import type { ImageMetadata } from "astro";
import { getCollection } from "astro:content";
import { locales, type Locale } from "../config/locales";
import { ContentValidationError, lineKey, validateContent } from "./content-validation";
import { getRecipeImage, recipeImages } from "./image-registry";
import type { Ingredient, Recipe, TaxonomyLabels, Translation, YieldUnit } from "./schemas";
import type { UnitId } from "./units";
import { paths } from "./urls";

/** Serializable ingredient line, passed to the React ingredient island. */
export interface IngredientView {
  key: string;
  amount: number | null;
  amountMax?: number;
  unit: UnitId | null;
  scalable: boolean;
  singular: string;
  plural: string;
  withUnit: string;
  note?: string;
}

export interface IngredientGroupView {
  id: string | null;
  label: string | null;
  lines: IngredientView[];
}

export interface LocalizedImage {
  file: string;
  image: ImageMetadata;
  alt: string;
}

export interface LocalizedRecipe {
  id: string;
  locale: Locale;
  slug: string;
  url: string;
  title: string;
  description: string;
  servings?: number;
  yieldUnit: YieldUnit;
  category: { id: string; label: string };
  tags: { id: string; label: string }[];
  time: Recipe["time"];
  cover: LocalizedImage;
  gallery: LocalizedImage[];
  ingredientGroups: IngredientGroupView[];
  steps: {
    id: string;
    text: string;
    image?: LocalizedImage;
    durationMinutes?: number;
    temperatureCelsius?: number;
  }[];
  notes: string[];
  /** URL of this recipe per available locale (only real routes). */
  alternates: Partial<Record<Locale, string>>;
}

interface SiteData {
  ingredients: Map<string, Ingredient>;
  categories: Map<string, TaxonomyLabels>;
  tags: Map<string, TaxonomyLabels>;
  recipes: Map<string, { core: Recipe; translations: Partial<Record<Locale, Translation>> }>;
}

let cache: Promise<SiteData> | undefined;

async function load(): Promise<SiteData> {
  const [ingredients, recipes, translations, categories, tags] = await Promise.all([
    getCollection("ingredients"),
    getCollection("recipes"),
    getCollection("recipeTranslations"),
    getCollection("categories"),
    getCollection("tags"),
  ]);

  const translationSources = translations.map((entry) => {
    const [recipeDir = "", fileLocale = ""] = entry.id.split("/");
    return { recipeDir, fileLocale, data: entry.data };
  });

  // Invalid relationships must fail the build instead of silently dropping pages.
  const errors = validateContent({
    ingredients: ingredients.map((e) => ({ sourceId: e.id, data: e.data })),
    recipes: recipes.map((e) => ({ sourceId: e.id, data: e.data })),
    translations: translationSources,
    categories: categories.map((e) => ({ sourceId: e.id, data: e.data })),
    tags: tags.map((e) => ({ sourceId: e.id, data: e.data })),
    images: new Set(recipeImages.keys()),
  });
  if (errors.length > 0) throw new ContentValidationError(errors);

  const byId: SiteData["recipes"] = new Map(
    recipes.map((e) => [e.data.id, { core: e.data, translations: {} }]),
  );
  for (const { recipeDir, data } of translationSources) {
    const entry = byId.get(recipeDir);
    if (entry) entry.translations[data.locale] = data;
  }

  return {
    ingredients: new Map(ingredients.map((e) => [e.data.id, e.data])),
    categories: new Map(categories.map((e) => [e.id, e.data])),
    tags: new Map(tags.map((e) => [e.id, e.data])),
    recipes: byId,
  };
}

function siteData(): Promise<SiteData> {
  cache ??= load();
  return cache;
}

function localize(
  data: SiteData,
  core: Recipe,
  translations: Partial<Record<Locale, Translation>>,
  locale: Locale,
): LocalizedRecipe {
  const t = translations[locale];
  if (!t) throw new Error(`Recipe "${core.id}" has no "${locale}" translation`);

  const image = (file: string): LocalizedImage => ({
    file,
    image: getRecipeImage(core.id, file),
    alt: t.imageAlt[file] ?? "",
  });

  const groups: IngredientGroupView[] = [];
  for (const line of core.ingredients) {
    const groupId = line.group ?? null;
    let group = groups.find((g) => g.id === groupId);
    if (!group) {
      group = {
        id: groupId,
        label: groupId ? (t.ingredientGroups[groupId] ?? null) : null,
        lines: [],
      };
      groups.push(group);
    }
    const names = data.ingredients.get(line.id)?.names[locale];
    const key = lineKey(line);
    const singular = names?.singular ?? line.id;
    const plural = names?.plural ?? singular;
    group.lines.push({
      key,
      amount: line.amount,
      ...(line.amountMax !== undefined ? { amountMax: line.amountMax } : {}),
      unit: line.unit,
      scalable: line.scalable ?? true,
      singular,
      plural,
      withUnit: names?.withUnit ?? plural,
      ...(t.ingredientNotes[key] ? { note: t.ingredientNotes[key] } : {}),
    });
  }

  const alternates: Partial<Record<Locale, string>> = {};
  for (const l of locales) {
    const tl = translations[l];
    if (tl) alternates[l] = paths.recipe(l, tl.slug);
  }

  return {
    id: core.id,
    locale,
    slug: t.slug,
    url: paths.recipe(locale, t.slug),
    title: t.title,
    description: t.description,
    ...(core.servings !== undefined ? { servings: core.servings } : {}),
    yieldUnit: core.yieldUnit,
    category: { id: core.category, label: data.categories.get(core.category)?.[locale] ?? "" },
    tags: core.tags.map((id) => ({ id, label: data.tags.get(id)?.[locale] ?? id })),
    time: core.time,
    cover: image(core.images.cover),
    gallery: core.images.gallery.map(image),
    ingredientGroups: groups,
    steps: core.steps.map((step) => ({
      id: step.id,
      text: t.steps[step.id] ?? "",
      ...(step.image ? { image: image(step.image) } : {}),
      ...(step.durationMinutes ? { durationMinutes: step.durationMinutes } : {}),
      ...(step.temperatureCelsius ? { temperatureCelsius: step.temperatureCelsius } : {}),
    })),
    notes: t.notes,
    alternates,
  };
}

/** All recipes published in `locale`, sorted by title. */
export async function getRecipes(locale: Locale): Promise<LocalizedRecipe[]> {
  const data = await siteData();
  return [...data.recipes.values()]
    .filter(({ translations }) => translations[locale])
    .map(({ core, translations }) => localize(data, core, translations, locale))
    .sort((a, b) => a.title.localeCompare(b.title, locale));
}

export async function getCategoryLabels(locale: Locale): Promise<Map<string, string>> {
  const data = await siteData();
  return new Map([...data.categories].map(([id, labels]) => [id, labels[locale] ?? id]));
}

export function totalMinutes(time: Recipe["time"]): number {
  return (time.preparationMinutes ?? 0) + (time.cookingMinutes ?? 0) + (time.restingMinutes ?? 0);
}

export function ingredientCount(recipe: LocalizedRecipe): number {
  return recipe.ingredientGroups.reduce((sum, g) => sum + g.lines.length, 0);
}
