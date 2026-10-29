import type { Locale } from "../config/locales";
import type { YieldUnit } from "../lib/schemas";

type Inflected = { one: string; other: string };

const de = {
  siteName: "Rezept-Blog",
  siteDescription: "Einfache, leckere Rezepte zum Nachkochen.",
  skipToContent: "Zum Inhalt springen",
  nav: { home: "Startseite", recipes: "Rezepte", about: "Über uns", main: "Hauptnavigation" },
  languageSwitch: "Sprache wählen",
  footer: "Mit Liebe gekocht.",
  home: {
    title: "Willkommen!",
    intro: "Hier findest du leckere und einfache Rezepte zum Nachkochen.",
    latest: "Rezepte",
    allRecipes: "Alle Rezepte ansehen",
  },
  recipes: {
    title: "Alle Rezepte",
    description: "Alle Rezepte durchsuchen und nach Kategorie oder Stichwort filtern.",
    empty: "Noch keine Rezepte verfügbar. Komm bald wieder!",
    searchLabel: "Rezepte durchsuchen",
    searchPlaceholder: "Titel oder Zutat, z. B. Hähnchen",
    categoryLabel: "Kategorie",
    allCategories: "Alle Kategorien",
    tagsLabel: "Stichwörter",
    resetFilters: "Filter zurücksetzen",
    resultCount: (n: number) => (n === 1 ? "1 Rezept" : `${n} Rezepte`),
    noResults: "Keine passenden Rezepte gefunden.",
  },
  recipe: {
    yieldUnits: {
      servings: { one: "Portion", other: "Portionen" },
      trays: { one: "Blech", other: "Bleche" },
      "loaf-pans": { one: "Kastenform", other: "Kastenformen" },
      pieces: { one: "Stück", other: "Stück" },
    } as Record<YieldUnit, Inflected>,
    decreaseServings: "Menge verringern",
    increaseServings: "Menge erhöhen",
    resetServings: "Zurücksetzen",
    ingredients: "Zutaten",
    ingredientCount: (n: number) => `${n} Zutaten`,
    preparation: "Zubereitung",
    notes: "Tipps",
    gallery: "Bilder",
    toTaste: "nach Geschmack",
    copyIngredients: "Zutatenliste kopieren",
    copied: "Kopiert!",
    copyFailed: "Kopieren nicht möglich",
    checklistHint: "Abhaken, was du schon bereitgelegt hast.",
    time: {
      preparation: "Vorbereitung",
      cooking: "Kochen/Backen",
      resting: "Ruhezeit",
      total: "Gesamt",
    },
    minutes: (n: number) => formatDuration(n, "Std.", "Min."),
    stepDuration: "Dauer",
    temperature: "Temperatur",
    step: (n: number) => `Schritt ${n}`,
    openImage: (alt: string) => `Bild vergrößern: ${alt}`,
  },
  lightbox: { close: "Schließen", previous: "Vorheriges Bild", next: "Nächstes Bild" },
  about: {
    title: "Über uns",
    heading: "Wer wir sind",
    body: "Wir sind leidenschaftliche Hobbyköche, die ihre besten Rezepte teilen möchten. Einfach, lecker und für jedermann geeignet!",
  },
  notFound: {
    title: "Seite nicht gefunden",
    body: "Diese Seite gibt es leider nicht. Vielleicht findest du dein Rezept in der Übersicht.",
    back: "Zu allen Rezepten",
  },
};

export type UiStrings = typeof de;

const en: UiStrings = {
  siteName: "Recipe Blog",
  siteDescription: "Simple, tasty recipes to cook at home.",
  skipToContent: "Skip to content",
  nav: { home: "Home", recipes: "Recipes", about: "About", main: "Main navigation" },
  languageSwitch: "Choose language",
  footer: "Cooked with love.",
  home: {
    title: "Welcome!",
    intro: "Find simple and tasty recipes to cook at home.",
    latest: "Recipes",
    allRecipes: "Browse all recipes",
  },
  recipes: {
    title: "All recipes",
    description: "Search all recipes and filter by category or tag.",
    empty: "No recipes yet. Check back soon!",
    searchLabel: "Search recipes",
    searchPlaceholder: "Title or ingredient, e.g. chicken",
    categoryLabel: "Category",
    allCategories: "All categories",
    tagsLabel: "Tags",
    resetFilters: "Reset filters",
    resultCount: (n: number) => (n === 1 ? "1 recipe" : `${n} recipes`),
    noResults: "No matching recipes found.",
  },
  recipe: {
    yieldUnits: {
      servings: { one: "serving", other: "servings" },
      trays: { one: "baking tray", other: "baking trays" },
      "loaf-pans": { one: "loaf tin", other: "loaf tins" },
      pieces: { one: "piece", other: "pieces" },
    },
    decreaseServings: "Decrease amount",
    increaseServings: "Increase amount",
    resetServings: "Reset",
    ingredients: "Ingredients",
    ingredientCount: (n: number) => `${n} ingredients`,
    preparation: "Method",
    notes: "Tips",
    gallery: "Pictures",
    toTaste: "to taste",
    copyIngredients: "Copy ingredient list",
    copied: "Copied!",
    copyFailed: "Could not copy",
    checklistHint: "Tick off what you have ready.",
    time: {
      preparation: "Prep",
      cooking: "Cook",
      resting: "Resting",
      total: "Total",
    },
    minutes: (n: number) => formatDuration(n, "h", "min"),
    stepDuration: "Duration",
    temperature: "Temperature",
    step: (n: number) => `Step ${n}`,
    openImage: (alt: string) => `Enlarge image: ${alt}`,
  },
  lightbox: { close: "Close", previous: "Previous image", next: "Next image" },
  about: {
    title: "About",
    heading: "Who we are",
    body: "We are passionate home cooks who love sharing our best recipes. Simple, tasty and for everyone!",
  },
  notFound: {
    title: "Page not found",
    body: "Sorry, this page does not exist. Maybe you can find your recipe in the overview.",
    back: "Browse all recipes",
  },
};

function formatDuration(minutes: number, hourLabel: string, minuteLabel: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} ${minuteLabel}`;
  return m === 0 ? `${h} ${hourLabel}` : `${h} ${hourLabel} ${m} ${minuteLabel}`;
}

export const ui: Record<Locale, UiStrings> = { de, en };

/** "4 Portionen", "2 Bleche", "1 loaf tin". */
export function yieldText(strings: UiStrings, count: number, unit: YieldUnit): string {
  const labels = strings.recipe.yieldUnits[unit];
  return `${count} ${count === 1 ? labels.one : labels.other}`;
}

export function t(locale: Locale): UiStrings {
  return ui[locale];
}
