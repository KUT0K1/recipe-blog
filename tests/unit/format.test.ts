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

describe("formatQuantity – ranges", () => {
  it("formats metric ranges", () => {
    expect(formatQuantity(200, "g", "de", 250)).toMatchObject({ amount: "200–250", unit: "g" });
  });

  it("normalises both ends based on the upper bound", () => {
    expect(formatQuantity(800, "g", "de", 1200)).toMatchObject({ amount: "0,8–1,2", unit: "kg" });
  });

  it("formats fraction ranges and inflects by the upper bound", () => {
    expect(formatQuantity(0.25, "cup", "de", 0.5)).toMatchObject({ amount: "¼–½", unit: "Becher" });
    expect(formatQuantity(0.5, "piece", "de", 1)).toMatchObject({
      amount: "½–1",
      nameForm: "singular",
    });
    expect(formatQuantity(6, "piece", "en", 8)).toMatchObject({
      amount: "6–8",
      nameForm: "plural",
    });
    expect(formatQuantity(2, "tbsp", "en", 3)).toMatchObject({ amount: "2–3", unit: "tbsp" });
  });

  it("collapses ranges whose ends round to the same value", () => {
    expect(formatQuantity(1, "clove", "en", 1.1).amount).toBe("1");
  });
});

describe("formatQuantity – counting units", () => {
  it("labels cups, cubes, packets and bunches", () => {
    expect(formatQuantity(1, "cube", "de")).toMatchObject({ amount: "1", unit: "Würfel" });
    expect(formatQuantity(0.5, "cube", "en")).toMatchObject({ amount: "½", unit: "cube" });
    expect(formatQuantity(2, "packet", "en")).toMatchObject({ unit: "packets" });
    expect(formatQuantity(1, "bunch", "de")).toMatchObject({ unit: "Bund" });
    expect(formatQuantity(1.5, "cup", "en")).toMatchObject({ amount: "1½", unit: "cups" });
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
    ).toBe("Salz – für das Nudelwasser");
    expect(
      formatIngredientText({ ...salt, amount: null, unit: null }, "de", "nach Geschmack"),
    ).toBe("Salz – nach Geschmack");
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
    expect(
      formatIngredientText(
        { ...egg, amount: 2, amountMax: 3, unit: "piece" },
        "de",
        "nach Geschmack",
      ),
    ).toBe("2–3 Eier");
  });
});
