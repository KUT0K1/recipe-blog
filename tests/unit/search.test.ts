import { describe, expect, it } from "vitest";
import { buildSearchText, matchesQuery, normalizeSearchText } from "../../src/lib/search";

describe("search", () => {
  const text = buildSearchText({
    title: "Cremige Hähnchen-Speck-Pasta",
    description: "Pasta in Sahnesauce",
    category: "Hauptgerichte",
    tags: ["Schnell"],
    ingredients: ["Knoblauch", "Crème fraîche"],
  });

  it("normalises case and diacritics", () => {
    expect(normalizeSearchText("Crème Fraîche")).toBe("creme fraiche");
    expect(normalizeSearchText("Straße")).toBe("strasse");
  });

  it("matches umlauts written in all common ways", () => {
    expect(matchesQuery(text, "Hähnchen")).toBe(true);
    expect(matchesQuery(text, "haehnchen")).toBe(true);
    expect(matchesQuery(text, "hahnchen")).toBe(true);
  });

  it("requires every term to match", () => {
    expect(matchesQuery(text, "pasta knoblauch")).toBe(true);
    expect(matchesQuery(text, "pasta kuchen")).toBe(false);
  });

  it("matches everything for an empty query", () => {
    expect(matchesQuery(text, "  ")).toBe(true);
  });
});
