import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import {
  ingredientSchema,
  recipeSchema,
  taxonomyLabelSchema,
  translationSchema,
} from "./lib/schemas";

// IDs are derived from file locations so cross-file validation can compare
// them with the IDs declared inside the files.
const ingredients = defineCollection({
  loader: glob({
    pattern: "*.yaml",
    base: "./src/content/ingredients",
    generateId: ({ entry }) => entry.replace(/\.yaml$/, ""),
  }),
  schema: ingredientSchema,
});

const recipes = defineCollection({
  loader: glob({
    pattern: "*/recipe.yaml",
    base: "./src/content/recipes",
    generateId: ({ entry }) => entry.replace(/\/recipe\.yaml$/, ""),
  }),
  schema: recipeSchema,
});

/** Entry IDs have the form "<recipe-folder>/<locale>". */
const recipeTranslations = defineCollection({
  loader: glob({
    pattern: "*/!(recipe).yaml",
    base: "./src/content/recipes",
    generateId: ({ entry }) => entry.replace(/\.yaml$/, ""),
  }),
  schema: translationSchema,
});

const categories = defineCollection({
  loader: file("./src/content/categories.yaml"),
  schema: taxonomyLabelSchema,
});

const tags = defineCollection({
  loader: file("./src/content/tags.yaml"),
  schema: taxonomyLabelSchema,
});

export const collections = { ingredients, recipes, recipeTranslations, categories, tags };
