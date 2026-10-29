import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { validateContent } from "../src/lib/content-validation";
import { loadContentFromDisk } from "./load-content";

// Validates the real content in src/ – run alone via `npm run validate`.
describe("repository content", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const { input, errors } = loadContentFromDisk(root);

  it("matches the Zod schemas", () => {
    expect(errors).toEqual([]);
  });

  it("passes cross-file validation", () => {
    expect(validateContent(input)).toEqual([]);
  });

  it("contains at least one recipe", () => {
    expect(input.recipes.length).toBeGreaterThan(0);
  });
});
