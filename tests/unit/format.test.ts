import { describe, expect, it } from "vitest";
import { formatIngredientText, formatQuantity } from "../../src/lib/format";

describe("formatQuantity – metric", () => {
  it("localises decimal separators", () => {
    expect(formatQuantity(2.5, "g", "de")).toMatchObject({ amount: "2,5", unit: "g" });
    expect(formatQuantity(2.5, "g", "en")).toMatchObject({ amount: "2.5", unit: "g" });
  });

  it("applies magnitude-dependent precision", () => {
    expect(formatQuantity(0.333, "g", "en").amount).toBe("0.33");
    expect(formatQuantity(3.333, "g", "en").amount).toBe("3.3");
    expect(formatQuantity(33.3, "ml", "en").amount).toBe("33");
    expect(formatQuantity(333.3, "g", "en").amount).toBe("335");
  });

  it("never shows zero for small positive amounts", () => {
    expect(formatQuantity(0.004, "g", "en").amount).toBe("0.004");
    expect(formatQuantity(0.001, "kg", "en").amount).toBe("0.01");
  });

  it("normalises g -> kg and ml -> l from 1000 upwards", () => {
    expect(formatQuantity(1000, "g", "de")).toMatchObject({ amount: "1", unit: "kg" });
    expect(formatQuantity(1250, "g", "de")).toMatchObject({ amount: "1,25", unit: "kg" });
    expect(formatQuantity(1500, "ml", "en")).toMatchObject({ amount: "1.5", unit: "l" });
    expect(formatQuantity(999, "g", "en")).toMatchObject({ amount: "1", unit: "kg" });
    expect(formatQuantity(990, "g", "en")).toMatchObject({ amount: "990", unit: "g" });
  });

  it("does not inflect mass or volume units", () => {
    expect(formatQuantity(1, "kg", "de")).toMatchObject({ unit: "kg", nameForm: "withUnit" });
  });
});

describe("formatQuantity – fractions", () => {
  it("renders quarters with fraction glyphs", () => {
    expect(formatQuantity(0.5, "tbsp", "de").amount).toBe("½");
    expect(formatQuantity(1.5, "tsp", "en").amount).toBe("1½");
    expect(formatQuantity(2.75, "piece", "en").amount).toBe("2¾");
    expect(formatQuantity(3, "piece", "en").amount).toBe("3");
  });

  it("rounds to the nearest quarter but never to zero", () => {
    expect(formatQuantity(1.1, "clove", "en").amount).toBe("1");
    expect(formatQuantity(0.05, "pinch", "en").amount).toBe("¼");
  });

  it("inflects unit labels and piece-counted ingredient names", () => {
    expect(formatQuantity(1, "clove", "de")).toMatchObject({ unit: "Zehe" });
    expect(formatQuantity(2, "clove", "de")).toMatchObject({ unit: "Zehen" });
    expect(formatQuantity(1, "piece", "de")).toMatchObject({ unit: "", nameForm: "singular" });
    expect(formatQuantity(2, "piece", "de")).toMatchObject({ unit: "", nameForm: "plural" });
    expect(formatQuantity(2, "clove", "de")).toMatchObject({ nameForm: "withUnit" });
  });
});

describe("formatQuantity – to taste", () => {
  it("returns empty amount without arithmetic", () => {
    expect(formatQuantity(null, null, "de")).toEqual({
      amount: "",
      unit: "",
      nameForm: "withUnit",
    });
  });
});

describe("formatIngredientText", () => {
  const egg = { singular: "Ei", plural: "Eier", withUnit: "Eier" };
  const salt = { singular: "Salz", plural: "Salz", withUnit: "Salz" };

  it("builds plain-text lines", () => {
    expect(formatIngredientText({ ...egg, amount: 1, unit: "piece" }, "de", "nach Geschmack")).toBe(
      "1 Ei",
    );
    expect(formatIngredientText({ ...egg, amount: 3, unit: "piece" }, "de", "nach Geschmack")).toBe(
      "3 Eier",
    );
    expect(
      formatIngredientText(
        { ...salt, amount: null, unit: null, note: "für das Nudelwasser" },
        "de",
        "nach Geschmack",
      ),
    ).toBe("Salz – nach Geschmack (für das Nudelwasser)");
    expect(
      formatIngredientText(
        {
          singular: "Hähnchenbrust",
          plural: "Hähnchenbrüste",
          withUnit: "Hähnchenbrust",
          amount: 200,
          unit: "g",
        },
        "de",
        "nach Geschmack",
      ),
    ).toBe("200 g Hähnchenbrust");
  });
});
