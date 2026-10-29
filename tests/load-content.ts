import { globSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { parse } from "yaml";
import type { ContentInput } from "../src/lib/content-validation";
import {
  ingredientSchema,
  recipeSchema,
  taxonomyLabelSchema,
  translationSchema,
} from "../src/lib/schemas";
import { z } from "astro/zod";

/**
 * Reads the content tree from disk the same way the Astro loaders do, so the
 * validation can run in plain Node (unit tests / CI) without a full build.
 * Schema errors are collected instead of thrown.
 */
export function loadContentFromDisk(root: string): { input: ContentInput; errors: string[] } {
  const errors: string[] = [];
  const read = <T>(file: string, schema: z.ZodType<T>): T | undefined => {
    const result = schema.safeParse(parse(readFileSync(file, "utf8")));
    if (result.success) return result.data;
    errors.push(`${relative(root, file)}: ${z.prettifyError(result.error).replace(/\n/g, " ")}`);
    return undefined;
  };
  const files = (pattern: string) => globSync(pattern, { cwd: root }).sort();

  const input: ContentInput = {
    ingredients: [],
    recipes: [],
    translations: [],
    categories: [],
    tags: [],
    images: new Set(
      files("src/assets/recipes/**/*.{jpg,jpeg,png,webp,avif}").map((f) =>
        relative("src/assets/recipes", f).split("\\").join("/"),
      ),
    ),
  };

  for (const file of files("src/content/ingredients/*.yaml")) {
    const data = read(join(root, file), ingredientSchema);
    if (data) input.ingredients.push({ sourceId: basename(file, ".yaml"), data });
  }
  for (const file of files("src/content/recipes/*/*.yaml")) {
    const dir = basename(dirname(file));
    const name = basename(file, ".yaml");
    if (name === "recipe") {
      const data = read(join(root, file), recipeSchema);
      if (data) input.recipes.push({ sourceId: dir, data });
    } else {
      const data = read(join(root, file), translationSchema);
      if (data) input.translations.push({ recipeDir: dir, fileLocale: name, data });
    }
  }
  for (const [key, file] of [
    ["categories", "src/content/categories.yaml"],
    ["tags", "src/content/tags.yaml"],
  ] as const) {
    const raw = parse(readFileSync(join(root, file), "utf8")) as Record<string, unknown>;
    for (const [id, value] of Object.entries(raw ?? {})) {
      const result = taxonomyLabelSchema.safeParse(value);
      if (result.success) input[key].push({ sourceId: id, data: result.data });
      else errors.push(`${file} (${id}): ${z.prettifyError(result.error)}`);
    }
  }
  return { input, errors };
}
