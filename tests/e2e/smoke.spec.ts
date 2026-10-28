import { expect, test } from "@playwright/test";

test("root forwards to the German home page", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveURL(/\/de\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
});

test("changing servings from 4 to 8 doubles scalable amounts only", async ({ page }) => {
  await page.goto("de/recipes/haehnchen-speck-pasta/");
  const servings = page.getByTestId("servings-input");
  await expect(servings).toHaveValue("4");
  await expect(page.getByTestId("amount-pasta")).toHaveText("400 g");

  await servings.fill("8");
  await expect(page.getByTestId("amount-pasta")).toHaveText("800 g");
  await expect(page.getByTestId("amount-cream")).toHaveText("400 ml");
  await expect(page.getByTestId("amount-garlic")).toHaveText("2 Zehen");
  await expect(page.getByText("– nach Geschmack")).toBeVisible();

  await page.getByRole("button", { name: "Eine Portion weniger" }).click();
  await expect(servings).toHaveValue("7");
  await expect(page.getByTestId("amount-pasta")).toHaveText("700 g");
});

test("ingredient checklist can be toggled with the keyboard", async ({ page }) => {
  await page.goto("de/recipes/haehnchen-speck-pasta/");
  const box = page.getByRole("checkbox", { name: /Pasta$/ });
  await box.focus();
  await page.keyboard.press("Space");
  await expect(box).toBeChecked();
});

test("language switch keeps the recipe and sets hreflang links", async ({ page }) => {
  await page.goto("de/recipes/haehnchen-speck-pasta/");
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en\/recipes\/creamy-chicken-bacon-pasta\/$/,
  );
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/recipes\/creamy-chicken-bacon-pasta\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Creamy Chicken and Bacon Pasta",
  );
});

test("recipe search filters by ingredient name", async ({ page }) => {
  await page.goto("de/recipes/");
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByLabel("Rezepte durchsuchen").fill("mascarpone");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText("Biscoff");
  await page.getByLabel("Rezepte durchsuchen").fill("hahnchen");
  await expect(page.getByRole("article")).toContainText("Hähnchen");
});

test("recipe page has valid JSON-LD", async ({ page }) => {
  await page.goto("en/recipes/biscoff-no-bake-cheesecake/");
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(json ?? "{}");
  expect(data["@type"]).toBe("Recipe");
  expect(data.recipeIngredient).toContain("200 g biscuits");
  expect(data.image[0]).toMatch(/^https?:\/\//);
});

test("page has no horizontal overflow", async ({ page }) => {
  await page.goto("de/recipes/biscoff-no-bake-cheesecake/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
