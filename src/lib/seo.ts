import { localeMeta } from "../config/locales";
import { formatIngredientText } from "./format";
import { totalMinutes, type LocalizedRecipe } from "./recipes";

const isoDuration = (minutes: number) => `PT${minutes}M`;

/** schema.org Recipe JSON-LD. No ratings or nutrition: we have no such data. */
export function recipeJsonLd(
  recipe: LocalizedRecipe,
  options: {
    url: string;
    imageUrl: string;
    toTaste: string;
    siteName: string;
    yield?: string;
  },
) {
  const { time } = recipe;
  const total = totalMinutes(time);
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    url: options.url,
    image: [options.imageUrl],
    inLanguage: localeMeta[recipe.locale].intl,
    author: { "@type": "Organization", name: options.siteName },
    ...(options.yield ? { recipeYield: options.yield } : {}),
    recipeCategory: recipe.category.label,
    keywords: recipe.tags.map((tag) => tag.label).join(", "),
    ...(time.preparationMinutes ? { prepTime: isoDuration(time.preparationMinutes) } : {}),
    ...(time.cookingMinutes ? { cookTime: isoDuration(time.cookingMinutes) } : {}),
    ...(total ? { totalTime: isoDuration(total) } : {}),
    recipeIngredient: recipe.ingredientGroups.flatMap((group) =>
      group.lines.map((line) => formatIngredientText(line, recipe.locale, options.toTaste)),
    ),
    recipeInstructions: recipe.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: step.text,
    })),
  };
}

/** Serialises JSON-LD safely for embedding in a <script> element. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
