/** Lower-cases and strips diacritics so "Hähnchen" matches "hahnchen" and "haehnchen". */
export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function variants(value: string): string[] {
  const umlautsAsVowels = value
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss");
  return [normalizeSearchText(value), umlautsAsVowels];
}

export interface SearchableRecipe {
  title: string;
  description: string;
  ingredients: string[];
  category: string;
  tags: string[];
}

export function buildSearchText(recipe: SearchableRecipe): string {
  return [recipe.title, recipe.description, recipe.category, ...recipe.tags, ...recipe.ingredients]
    .flatMap(variants)
    .join(" ");
}

/** Every whitespace-separated term of the query must occur in the haystack. */
export function matchesQuery(searchText: string, query: string): boolean {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  return terms.every((term) => searchText.includes(term));
}
