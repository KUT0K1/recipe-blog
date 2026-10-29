import type { ImageMetadata } from "astro";

// Static, build-time registry of all recipe images. YAML files reference images
// by path relative to src/assets/recipes/<recipe-id>/; this map resolves those
// references without dynamic imports.
const modules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/recipes/**/*.{jpg,jpeg,png,webp,avif}",
  { eager: true },
);

const PREFIX = "/src/assets/recipes/";

export const recipeImages: ReadonlyMap<string, ImageMetadata> = new Map(
  Object.entries(modules).map(([path, mod]) => [path.slice(PREFIX.length), mod.default]),
);

export function getRecipeImage(recipeId: string, file: string): ImageMetadata {
  const image = recipeImages.get(`${recipeId}/${file}`);
  if (!image) throw new Error(`Missing image src/assets/recipes/${recipeId}/${file}`);
  return image;
}
