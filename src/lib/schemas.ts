import { z } from "astro/zod";
import { locales } from "../config/locales";
import { unitIds } from "./units";

/** Stable, language-independent technical IDs (kebab-case). */
export const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "IDs must be lowercase kebab-case (a-z, 0-9, -)");

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slugs must be lowercase, URL-safe kebab-case");

/**
 * Image paths relative to src/assets/recipes/<recipe-id>/. Sub-folders are
 * allowed; traversal, absolute paths, URLs and unusual characters are not.
 */
export const imagePathSchema = z
  .string()
  .regex(
    /^(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp|avif)$/,
    "Image paths must be relative, lowercase and end in .jpg/.jpeg/.png/.webp/.avif",
  )
  .refine((value) => !value.split("/").includes(".."), "Path traversal is not allowed");

const localeEnum = z.enum(locales);

const nounSchema = z.strictObject({
  singular: z.string().min(1),
  /** Used for counts other than one ("2 Eier"); defaults to singular. */
  plural: z.string().min(1).optional(),
  /** Used after a unit ("200 g Hähnchenbrust"); defaults to plural. */
  withUnit: z.string().min(1).optional(),
});

export const ingredientSchema = z.strictObject({
  id: idSchema,
  category: idSchema,
  names: z.partialRecord(localeEnum, nounSchema),
  defaultUnit: z.enum(unitIds).optional(),
});

export const ingredientLineSchema = z
  .strictObject({
    id: idSchema,
    /** Needed when the same ingredient appears twice in one recipe. */
    key: idSchema.optional(),
    /** Optional group, e.g. "crust" / "filling"; names live in translations. */
    group: idSchema.optional(),
    amount: z.number().positive().nullable(),
    /** Upper bound for ranges such as "2–3 EL"; `amount` is the lower bound. */
    amountMax: z.number().positive().optional(),
    unit: z.enum(unitIds).nullable(),
    scalable: z.boolean().optional(),
  })
  .refine((line) => (line.amount === null) === (line.unit === null), {
    message: "`unit` must be null exactly when `amount` is null",
  })
  .refine(
    (line) =>
      line.amountMax === undefined || (line.amount !== null && line.amountMax > line.amount),
    {
      message: "`amountMax` requires `amount` and must be greater than it",
    },
  );

export const stepSchema = z.strictObject({
  id: idSchema,
  image: imagePathSchema.optional(),
  durationMinutes: z.number().int().positive().optional(),
  temperatureCelsius: z.number().int().positive().optional(),
});

/** What `servings` counts; labels live in the UI dictionary. */
export const yieldUnits = ["servings", "trays", "loaf-pans", "pieces"] as const;
export type YieldUnit = (typeof yieldUnits)[number];

export const recipeSchema = z.strictObject({
  id: idSchema,
  /** Optional: without it amounts are shown as written and cannot be scaled. */
  servings: z.number().int().positive().optional(),
  yieldUnit: z.enum(yieldUnits).default("servings"),
  category: idSchema,
  tags: z.array(idSchema).default([]),
  time: z
    .strictObject({
      preparationMinutes: z.number().int().nonnegative().optional(),
      cookingMinutes: z.number().int().nonnegative().optional(),
      restingMinutes: z.number().int().nonnegative().optional(),
    })
    .default({}),
  images: z.strictObject({
    cover: imagePathSchema,
    gallery: z.array(imagePathSchema).default([]),
  }),
  ingredients: z.array(ingredientLineSchema).min(1),
  steps: z.array(stepSchema).min(1),
});

export const translationSchema = z.strictObject({
  locale: localeEnum,
  slug: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  imageAlt: z.record(z.string(), z.string().min(1)),
  ingredientGroups: z.record(z.string(), z.string().min(1)).default({}),
  steps: z.record(z.string(), z.string().min(1)),
  ingredientNotes: z.record(z.string(), z.string().min(1)).default({}),
  notes: z.array(z.string().min(1)).default([]),
});

/** Labels for categories and tags, keyed by ID in a single YAML file each. */
export const taxonomyLabelSchema = z.partialRecord(localeEnum, z.string().min(1));

export type Ingredient = z.infer<typeof ingredientSchema>;
export type IngredientLine = z.infer<typeof ingredientLineSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Translation = z.infer<typeof translationSchema>;
export type TaxonomyLabels = z.infer<typeof taxonomyLabelSchema>;
