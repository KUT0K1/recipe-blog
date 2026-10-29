import type { Locale } from "../config/locales";

/**
 * Display strategy per unit:
 * - "metric": decimal numbers with magnitude-dependent precision; may be
 *   normalised to a larger unit (g -> kg, ml -> l) for display only.
 * - "fraction": countable or spoon units, rounded to quarters and shown with
 *   fraction glyphs (½, ¼, ¾).
 */
export type DisplayStrategy = "metric" | "fraction";

export const unitIds = ["g", "kg", "ml", "l", "piece", "clove", "tbsp", "tsp", "pinch"] as const;
export type UnitId = (typeof unitIds)[number];

interface UnitLabel {
  one: string;
  other: string;
}

export interface UnitDefinition {
  strategy: DisplayStrategy;
  /** Larger unit to switch to at 1000 (g -> kg, ml -> l). */
  normalizeTo?: { unit: UnitId; factor: number };
  /** Empty labels mean the ingredient name carries the count ("2 Eier"). */
  labels: Record<Locale, UnitLabel>;
}

const same = (label: string): UnitLabel => ({ one: label, other: label });

export const units: Record<UnitId, UnitDefinition> = {
  g: {
    strategy: "metric",
    normalizeTo: { unit: "kg", factor: 1000 },
    labels: { de: same("g"), en: same("g") },
  },
  kg: { strategy: "metric", labels: { de: same("kg"), en: same("kg") } },
  ml: {
    strategy: "metric",
    normalizeTo: { unit: "l", factor: 1000 },
    labels: { de: same("ml"), en: same("ml") },
  },
  l: { strategy: "metric", labels: { de: same("l"), en: same("l") } },
  piece: { strategy: "fraction", labels: { de: same(""), en: same("") } },
  clove: {
    strategy: "fraction",
    labels: { de: { one: "Zehe", other: "Zehen" }, en: { one: "clove", other: "cloves" } },
  },
  tbsp: { strategy: "fraction", labels: { de: same("EL"), en: same("tbsp") } },
  tsp: { strategy: "fraction", labels: { de: same("TL"), en: same("tsp") } },
  pinch: {
    strategy: "fraction",
    labels: { de: { one: "Prise", other: "Prisen" }, en: { one: "pinch", other: "pinches" } },
  },
};

export function isUnitId(value: string): value is UnitId {
  return Object.hasOwn(units, value);
}
