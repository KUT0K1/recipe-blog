import { useId, useState } from "react";
import type { Locale } from "../config/locales";
import { formatIngredientText, formatQuantity } from "../lib/format";
import type { IngredientGroupView } from "../lib/recipes";
import { MIN_SERVINGS, isValidServings, maxServingsFor, scaleAmount } from "../lib/scaling";

export interface RecipeIngredientsLabels {
  heading: string;
  servings: string;
  decrease: string;
  increase: string;
  reset: string;
  toTaste: string;
  copy: string;
  copied: string;
  copyFailed: string;
  checklistHint: string;
}

interface Props {
  locale: Locale;
  baseServings: number;
  groups: IngredientGroupView[];
  labels: RecipeIngredientsLabels;
}

type CopyState = "idle" | "copied" | "failed";

export default function RecipeIngredients({ locale, baseServings, groups, labels }: Props) {
  const [servings, setServings] = useState(baseServings);
  const [draft, setDraft] = useState(String(baseServings));
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const inputId = useId();
  const hintId = useId();
  const max = maxServingsFor(baseServings);

  const update = (value: number) => {
    const next = Math.min(max, Math.max(MIN_SERVINGS, Math.round(value)));
    setServings(next);
    setDraft(String(next));
  };

  const scaled = groups.map((group) => ({
    ...group,
    lines: group.lines.map((line) => ({
      ...line,
      amount: scaleAmount(line, baseServings, servings),
    })),
  }));

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const copy = async () => {
    const text = scaled
      .map((group) => {
        const lines = group.lines.map(
          (line) => `- ${formatIngredientText(line, locale, labels.toTaste)}`,
        );
        return [group.label ? `${group.label}:` : null, ...lines].filter(Boolean).join("\n");
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(
        `${labels.heading} (${servings} ${labels.servings})\n\n${text}`,
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 2500);
  };

  const buttonClass =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 font-semibold text-stone-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
    >
      <h2 id={`${inputId}-heading`} className="mb-4 text-2xl font-bold">
        {labels.heading}
      </h2>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="mr-1 font-medium">
          {labels.servings}
        </label>
        <button
          type="button"
          className={buttonClass}
          onClick={() => update(servings - 1)}
          disabled={servings <= MIN_SERVINGS}
          aria-label={labels.decrease}
          aria-controls={`${inputId}-list`}
        >
          −
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={MIN_SERVINGS}
          max={max}
          step={1}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            const value = Number(event.target.value);
            if (isValidServings(value, max)) setServings(value);
          }}
          onBlur={() => setDraft(String(servings))}
          aria-controls={`${inputId}-list`}
          className="h-10 w-16 rounded-md border border-stone-300 text-center text-lg font-semibold"
          data-testid="servings-input"
        />
        <button
          type="button"
          className={buttonClass}
          onClick={() => update(servings + 1)}
          disabled={servings >= max}
          aria-label={labels.increase}
          aria-controls={`${inputId}-list`}
        >
          +
        </button>
        {servings !== baseServings && (
          <button
            type="button"
            className="ml-1 text-sm text-brand-700 underline"
            onClick={() => update(baseServings)}
          >
            {labels.reset}
          </button>
        )}
      </div>

      <p id={hintId} className="mb-3 text-sm text-stone-600">
        {labels.checklistHint}
      </p>

      <div id={`${inputId}-list`} aria-live="polite">
        {scaled.map((group) => (
          <div key={group.id ?? "_"} className="mb-4 last:mb-0">
            {group.label && (
              <h3 className="mb-2 font-sans text-sm font-bold tracking-wide text-stone-600 uppercase">
                {group.label}
              </h3>
            )}
            <ul className="space-y-1" aria-describedby={hintId}>
              {group.lines.map((line) => {
                const q = formatQuantity(line.amount, line.unit, locale);
                const name = line[q.nameForm];
                const boxId = `${inputId}-${line.key}`;
                const isChecked = checked.has(line.key);
                return (
                  <li key={line.key}>
                    <label
                      htmlFor={boxId}
                      className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-stone-50"
                    >
                      <input
                        id={boxId}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(line.key)}
                        className="mt-1 size-4 shrink-0 accent-brand-600"
                      />
                      <span className={isChecked ? "text-stone-400 line-through" : undefined}>
                        {line.amount === null ? (
                          <>
                            {name} <span className="text-stone-600">– {labels.toTaste}</span>
                          </>
                        ) : (
                          <>
                            <strong
                              className="font-semibold tabular-nums"
                              data-testid={`amount-${line.key}`}
                            >
                              {[q.amount, q.unit].filter(Boolean).join(" ")}
                            </strong>{" "}
                            {name}
                          </>
                        )}
                        {line.note && <span className="text-stone-600"> ({line.note})</span>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button type="button" className={buttonClass} onClick={copy}>
          {labels.copy}
        </button>
        <span role="status" className="text-sm text-stone-600">
          {copyState === "copied" ? labels.copied : copyState === "failed" ? labels.copyFailed : ""}
        </span>
      </div>
    </section>
  );
}
