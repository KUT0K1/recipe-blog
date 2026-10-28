import { localeMeta, type Locale } from "../config/locales";
import { units, type UnitId } from "./units";

/** "withUnit" applies after a unit label ("200 g …"), the others to bare counts. */
export type NameForm = "singular" | "plural" | "withUnit";

export interface FormattedQuantity {
  /** Localised number, e.g. "1,5" or "1½". Empty for "to taste". */
  amount: string;
  /** Localised unit label, may be empty (e.g. for pieces). */
  unit: string;
  /** Which form of the ingredient name to show next to the quantity. */
  nameForm: NameForm;
}

const FRACTIONS: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };

function formatFraction(value: number, locale: Locale): { text: string; rounded: number } {
  // Round to quarters but never let a positive amount disappear.
  const rounded = Math.max(0.25, Math.round(value * 4) / 4);
  const whole = Math.floor(rounded);
  const rest = rounded - whole;
  const wholeText = whole > 0 ? new Intl.NumberFormat(localeMeta[locale].intl).format(whole) : "";
  return { text: `${wholeText}${FRACTIONS[rest] ?? ""}`, rounded };
}

/**
 * Metric precision rules:
 *   < 1     two significant digits (0,25 / 0,5)
 *   < 10    at most one decimal (2,5)
 *   < 100   integers
 *   >= 100  rounded to multiples of 5 (125, 340)
 * Values in kg/l get up to two decimals.
 */
function roundMetric(value: number, unit: UnitId): number {
  if (unit === "kg" || unit === "l") return Math.round(value * 100) / 100 || 0.01;
  if (value < 1) return Number(value.toPrecision(2));
  if (value < 10) return Math.round(value * 10) / 10;
  if (value < 100) return Math.round(value);
  return Math.round(value / 5) * 5;
}

function normalize(value: number, unit: UnitId): { value: number; unit: UnitId } {
  const target = units[unit].normalizeTo;
  if (target && value >= target.factor) {
    return { value: value / target.factor, unit: target.unit };
  }
  return { value, unit };
}

export function formatQuantity(
  amount: number | null,
  unit: UnitId | null,
  locale: Locale,
): FormattedQuantity {
  if (amount === null || unit === null) return { amount: "", unit: "", nameForm: "withUnit" };

  const def = units[unit];
  if (def.strategy === "fraction") {
    const { text, rounded } = formatFraction(amount, locale);
    const isOne = rounded <= 1;
    const label = def.labels[locale][isOne ? "one" : "other"];
    // Only the bare count ("1 Ei", "2 Eier") inflects the ingredient name.
    const nameForm = unit === "piece" ? (isOne ? "singular" : "plural") : "withUnit";
    return { amount: text, unit: label, nameForm };
  }

  const normalized = normalize(roundMetric(amount, unit), unit);
  const value = roundMetric(normalized.value, normalized.unit);
  const text = new Intl.NumberFormat(
    localeMeta[locale].intl,
    value < 1 ? { maximumSignificantDigits: 2 } : { maximumFractionDigits: 2 },
  ).format(value);
  return { amount: text, unit: units[normalized.unit].labels[locale].other, nameForm: "withUnit" };
}

export interface IngredientNames {
  singular: string;
  plural: string;
  withUnit: string;
}

export interface IngredientTextInput extends IngredientNames {
  amount: number | null;
  unit: UnitId | null;
  note?: string;
}

/** Plain-text line, e.g. "200 g Kekse" or "Salz – nach Geschmack". */
export function formatIngredientText(
  line: IngredientTextInput,
  locale: Locale,
  toTaste: string,
): string {
  const q = formatQuantity(line.amount, line.unit, locale);
  const name = line[q.nameForm];
  const main =
    line.amount === null
      ? `${name} – ${toTaste}`
      : [q.amount, q.unit, name].filter(Boolean).join(" ");
  return line.note ? `${main} (${line.note})` : main;
}
