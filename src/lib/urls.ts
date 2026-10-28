import type { Locale } from "../config/locales";

/**
 * Prefixes a site-relative path with the configured base path, so links work
 * both under /<repo>/ on GitHub Pages and at the root of a custom domain.
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${path.replace(/^\/+/, "")}`;
}

export const paths = {
  home: (locale: Locale) => withBase(`${locale}/`),
  recipes: (locale: Locale) => withBase(`${locale}/recipes/`),
  recipe: (locale: Locale, slug: string) => withBase(`${locale}/recipes/${slug}/`),
  about: (locale: Locale) => withBase(`${locale}/about/`),
};

export function absoluteUrl(path: string, site: URL | undefined): string {
  return site ? new URL(path, site).href : path;
}
