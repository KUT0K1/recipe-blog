import { describe, expect, it } from "vitest";
import { validateContent, type ContentInput } from "../../src/lib/content-validation";
import {
  imagePathSchema,
  ingredientLineSchema,
  recipeSchema,
  translationSchema,
  type Recipe,
  type Translation,
} from "../../src/lib/schemas";

const recipe = (): Recipe =>
  recipeSchema.parse({
    id: "gratin",
    servings: 2,
    category: "main-dishes",
    tags: ["casserole"],
    images: { cover: "cover.webp", gallery: ["finished.webp"] },
    ingredients: [
      { id: "potato", amount: 400, unit: "g", group: "base" },
      { id: "salt", amount: null, unit: null },
    ],
    steps: [{ id: "prepare" }, { id: "bake", image: "steps/bake.webp", temperatureCelsius: 180 }],
  });

const translation = (locale: "de" | "en", slug = "gratin"): Translation =>
  translationSchema.parse({
    locale,
    slug,
    title: "Gratin",
    description: "Lecker",
    imageAlt: { "cover.webp": "a", "finished.webp": "b", "steps/bake.webp": "c" },
    ingredientGroups: { base: "Basis" },
    steps: { prepare: "Vorbereiten", bake: "Backen" },
    ingredientNotes: { salt: "nach Belieben" },
  });

function fixture(): ContentInput {
  return {
    ingredients: [
      {
        sourceId: "potato",
        data: {
          id: "potato",
          category: "vegetables",
          names: {
            de: { singular: "Kartoffel", plural: "Kartoffeln" },
            en: { singular: "potato" },
          },
        },
      },
      {
        sourceId: "salt",
        data: { id: "salt", category: "spices", names: { de: { singular: "Salz" } } },
      },
    ],
    recipes: [{ sourceId: "gratin", data: recipe() }],
    translations: [{ recipeDir: "gratin", fileLocale: "de", data: translation("de") }],
    categories: [{ sourceId: "main-dishes", data: { de: "Hauptgerichte", en: "Main dishes" } }],
    tags: [{ sourceId: "casserole", data: { de: "Auflauf", en: "Casserole" } }],
    images: new Set(["gratin/cover.webp", "gratin/finished.webp", "gratin/steps/bake.webp"]),
  };
}

const errorsFor = (mutate: (input: ContentInput) => void) => {
  const input = fixture();
  mutate(input);
  return validateContent(input);
};

describe("validateContent", () => {
  it("accepts a consistent fixture", () => {
    expect(validateContent(fixture())).toEqual([]);
  });

  it("rejects unknown ingredient IDs", () => {
    expect(
      errorsFor((c) =>
        c.recipes[0]!.data.ingredients.push({ id: "unicorn", amount: 1, unit: "g" }),
      ),
    ).toEqual([expect.stringContaining('unknown ingredient id "unicorn"')]);
  });

  it("rejects duplicate ingredient lines without key", () => {
    const errors = errorsFor((c) =>
      c.recipes[0]!.data.ingredients.push({ id: "potato", amount: 1, unit: "g" }),
    );
    expect(errors).toEqual([expect.stringContaining('"potato" appears more than once')]);
  });

  it("accepts duplicate ingredients with distinct keys", () => {
    const errors = errorsFor((c) =>
      c.recipes[0]!.data.ingredients.push({
        id: "potato",
        key: "potato-topping",
        amount: 1,
        unit: "g",
      }),
    );
    expect(errors).toEqual([]);
  });

  it("rejects mismatching file and content IDs", () => {
    expect(errorsFor((c) => (c.ingredients[0]!.sourceId = "kartoffel"))).toContainEqual(
      expect.stringContaining('Ingredient file "kartoffel.yaml" declares id "potato"'),
    );
    expect(errorsFor((c) => (c.recipes[0]!.sourceId = "other"))).toContainEqual(
      expect.stringContaining("folder name and id"),
    );
  });

  it("rejects missing image files", () => {
    expect(
      errorsFor((c) => (c.images = new Set(["gratin/cover.webp", "gratin/finished.webp"]))),
    ).toEqual([
      expect.stringContaining("src/assets/recipes/gratin/steps/bake.webp does not exist"),
    ]);
  });

  it("rejects cover images repeated in the gallery", () => {
    expect(errorsFor((c) => c.recipes[0]!.data.images.gallery.push("cover.webp"))).toContainEqual(
      expect.stringContaining('"cover.webp" is listed more than once'),
    );
  });

  it("rejects missing and orphan step translations", () => {
    const errors = errorsFor((c) => {
      c.translations[0]!.data.steps = { prepare: "x", serve: "y" };
    });
    expect(errors).toEqual([
      expect.stringContaining('missing text for step "bake"'),
      expect.stringContaining('step "serve" does not exist'),
    ]);
  });

  it("rejects missing alt text", () => {
    expect(errorsFor((c) => delete c.translations[0]!.data.imageAlt["steps/bake.webp"])).toEqual([
      expect.stringContaining('missing alt text for image "steps/bake.webp"'),
    ]);
  });

  it("rejects missing ingredient group names and orphan notes", () => {
    const errors = errorsFor((c) => {
      c.translations[0]!.data.ingredientGroups = {};
      c.translations[0]!.data.ingredientNotes = { pepper: "x" };
    });
    expect(errors).toEqual([
      expect.stringContaining('missing name for ingredient group "base"'),
      expect.stringContaining('note for unknown ingredient line "pepper"'),
    ]);
  });

  it("rejects duplicate slugs within a locale", () => {
    const errors = errorsFor((c) => {
      const other = recipe();
      other.id = "gratin-2";
      c.recipes.push({ sourceId: "gratin-2", data: other });
      c.images = new Set(
        [...c.images].flatMap((img) => [img, img.replace("gratin/", "gratin-2/")]),
      );
      c.translations.push({ recipeDir: "gratin-2", fileLocale: "de", data: translation("de") });
    });
    expect(errors).toEqual([
      expect.stringContaining('slug "gratin" is already used by recipe "gratin"'),
    ]);
  });

  it("allows the same slug in different locales", () => {
    const errors = errorsFor((c) => {
      c.ingredients[1]!.data.names.en = { singular: "salt" };
      c.translations.push({ recipeDir: "gratin", fileLocale: "en", data: translation("en") });
    });
    expect(errors).toEqual([]);
  });

  it("requires the German translation", () => {
    expect(errorsFor((c) => (c.translations = []))).toEqual([
      expect.stringContaining("required translation de.yaml is missing"),
    ]);
  });

  it("rejects an English translation when an ingredient lacks an English name", () => {
    const errors = errorsFor((c) =>
      c.translations.push({ recipeDir: "gratin", fileLocale: "en", data: translation("en") }),
    );
    expect(errors).toEqual([expect.stringContaining('ingredient "salt" has no "en" name')]);
  });

  it("rejects translations whose filename and locale disagree", () => {
    expect(errorsFor((c) => (c.translations[0]!.fileLocale = "en"))).toContainEqual(
      expect.stringContaining("filename and locale must match"),
    );
  });

  it("rejects translations without a recipe", () => {
    expect(
      errorsFor((c) =>
        c.translations.push({
          recipeDir: "ghost",
          fileLocale: "de",
          data: translation("de", "ghost"),
        }),
      ),
    ).toEqual([expect.stringContaining('no recipe.yaml found in folder "ghost"')]);
  });

  it("rejects unknown categories and tags", () => {
    const errors = errorsFor((c) => {
      c.recipes[0]!.data.category = "snacks";
      c.recipes[0]!.data.tags = ["spicy"];
    });
    expect(errors).toEqual([
      expect.stringContaining('unknown category "snacks"'),
      expect.stringContaining('unknown tag "spicy"'),
    ]);
  });
});

describe("schemas", () => {
  it.each([
    "../cover.webp",
    "/etc/cover.webp",
    "https://example.com/a.jpg",
    "Cover.WEBP",
    "cover.gif",
    "a/../b.jpg",
  ])("rejects unsafe image path %s", (path) => {
    expect(imagePathSchema.safeParse(path).success).toBe(false);
  });

  it.each(["cover.webp", "steps/bake-1.jpg", "gallery/finished_2.avif"])(
    "accepts image path %s",
    (path) => {
      expect(imagePathSchema.safeParse(path).success).toBe(true);
    },
  );

  it("requires unit to be null exactly when amount is null", () => {
    expect(ingredientLineSchema.safeParse({ id: "salt", amount: null, unit: "g" }).success).toBe(
      false,
    );
    expect(ingredientLineSchema.safeParse({ id: "salt", amount: 5, unit: null }).success).toBe(
      false,
    );
    expect(ingredientLineSchema.safeParse({ id: "salt", amount: null, unit: null }).success).toBe(
      true,
    );
  });

  it("rejects non-positive and non-numeric amounts", () => {
    expect(ingredientLineSchema.safeParse({ id: "salt", amount: 0, unit: "g" }).success).toBe(
      false,
    );
    expect(ingredientLineSchema.safeParse({ id: "salt", amount: "200", unit: "g" }).success).toBe(
      false,
    );
    expect(
      ingredientLineSchema.safeParse({ id: "salt", amount: Infinity, unit: "g" }).success,
    ).toBe(false);
  });

  it("rejects unknown units and non-kebab IDs", () => {
    expect(ingredientLineSchema.safeParse({ id: "salt", amount: 1, unit: "cup" }).success).toBe(
      false,
    );
    expect(ingredientLineSchema.safeParse({ id: "Salz", amount: 1, unit: "g" }).success).toBe(
      false,
    );
  });
});
