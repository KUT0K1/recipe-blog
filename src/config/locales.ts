export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

/** Locales every recipe must provide. All others are optional. */
export const requiredLocales: readonly Locale[] = ["de"];

export const localeMeta: Record<Locale, { label: string; intl: string; ogLocale: string }> = {
  de: { label: "Deutsch", intl: "de-DE", ogLocale: "de_DE" },
  en: { label: "English", intl: "en-GB", ogLocale: "en_GB" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
