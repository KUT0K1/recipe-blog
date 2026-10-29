import { useId, useMemo, useState } from "react";
import { matchesQuery } from "../lib/search";
import RecipeCard, { type RecipeCardData } from "./RecipeCard";

export interface SearchIndexEntry {
  id: string;
  category: string;
  tags: string[];
  searchText: string;
  card: RecipeCardData;
}

export interface RecipeSearchLabels {
  search: string;
  placeholder: string;
  category: string;
  allCategories: string;
  tags: string;
  reset: string;
  noResults: string;
  resultCount: string[];
}

interface Props {
  entries: SearchIndexEntry[];
  categories: { id: string; label: string }[];
  tags: { id: string; label: string }[];
  labels: RecipeSearchLabels;
}

/** labels.resultCount = [singular template, plural template] with "{n}". */
function countLabel(templates: string[], n: number) {
  return (n === 1 ? templates[0] : templates[1])?.replace("{n}", String(n)) ?? String(n);
}

export default function RecipeSearch({ entries, categories, tags, labels }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [activeTags, setActiveTags] = useState<ReadonlySet<string>>(new Set());
  const id = useId();

  const results = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesQuery(entry.searchText, query) &&
          (!category || entry.category === category) &&
          [...activeTags].every((tag) => entry.tags.includes(tag)),
      ),
    [entries, query, category, activeTags],
  );

  const toggleTag = (tag: string) =>
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (!next.delete(tag)) next.add(tag);
      return next;
    });

  const filtered = query !== "" || category !== "" || activeTags.size > 0;

  return (
    <div>
      <form
        role="search"
        className="mb-6 grid gap-4 rounded-xl bg-surface p-4 ring-1 ring-line sm:grid-cols-[2fr_1fr]"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label htmlFor={`${id}-q`} className="mb-1 block font-medium">
            {labels.search}
          </label>
          <input
            id={`${id}-q`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.placeholder}
            className="h-11 w-full rounded-md border border-line-strong px-3"
          />
        </div>
        <div>
          <label htmlFor={`${id}-c`} className="mb-1 block font-medium">
            {labels.category}
          </label>
          <select
            id={`${id}-c`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-md border border-line-strong bg-surface px-3"
          >
            <option value="">{labels.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {tags.length > 0 && (
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 font-medium">{labels.tags}</legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={activeTags.has(tag.id)}
                  onClick={() => toggleTag(tag.id)}
                  className="rounded-full border border-line-strong bg-surface px-3 py-1 text-sm hover:bg-surface-hover aria-pressed:border-brand aria-pressed:bg-brand-tint aria-pressed:text-brand-ink"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </form>

      <div className="mb-4 flex items-center justify-between gap-4">
        <p role="status" className="text-fg-muted">
          {countLabel(labels.resultCount, results.length)}
        </p>
        {filtered && (
          <button
            type="button"
            className="text-sm text-brand underline"
            onClick={() => {
              setQuery("");
              setCategory("");
              setActiveTags(new Set());
            }}
          >
            {labels.reset}
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="py-8 text-center text-fg-muted">{labels.noResults}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((entry) => (
            <li key={entry.id}>
              <RecipeCard card={entry.card} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
