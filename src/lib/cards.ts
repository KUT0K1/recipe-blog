import { getImage } from "astro:assets";
import type { RecipeCardData } from "../components/RecipeCard";
import type { Locale } from "../config/locales";
import { t, yieldText } from "../i18n/ui";
import { ingredientCount, totalMinutes, type LocalizedRecipe } from "./recipes";

const CARD_WIDTHS = [400, 640, 960];
const CARD_SIZES = "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw";

/** Card data with build-time optimised image variants. */
export async function toCardData(recipe: LocalizedRecipe, locale: Locale): Promise<RecipeCardData> {
  const ui = t(locale);
  const strings = ui.recipe;
  const optimized = await getImage({
    src: recipe.cover.image,
    widths: CARD_WIDTHS,
    sizes: CARD_SIZES,
    format: "webp",
  });
  const minutes = totalMinutes(recipe.time);
  return {
    url: recipe.url,
    title: recipe.title,
    description: recipe.description,
    meta: [
      recipe.category.label,
      ...(recipe.servings ? [yieldText(ui, recipe.servings, recipe.yieldUnit)] : []),
      strings.ingredientCount(ingredientCount(recipe)),
      ...(minutes ? [strings.minutes(minutes)] : []),
    ],
    image: {
      src: optimized.src,
      srcset: optimized.srcSet.attribute,
      sizes: CARD_SIZES,
      width: Number(optimized.attributes.width ?? recipe.cover.image.width),
      height: Number(optimized.attributes.height ?? recipe.cover.image.height),
      alt: recipe.cover.alt,
    },
  };
}
