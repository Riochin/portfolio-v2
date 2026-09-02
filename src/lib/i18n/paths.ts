import { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * ロケール接頭辞の付け外し。
 *
 * このファイルは isomorphic ── next/root-params を import しない。
 * サーバーの metadata ヘルパーと Client Component の LanguageSwitcher の
 * 両方から使うため、server.ts と分けておくことが安全性の要件になっている。
 */

/** "/works" + "ja" -> "/ja/works"、"/" -> "/ja" */
export function localePath(locale: Locale, path: string): string {
  return path === "/" || path === "" ? `/${locale}` : `/${locale}${path}`;
}

/** "/ja/works/gitris" -> "/works/gitris"、"/ja" -> "/" */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first)) return pathname;
  return rest.length > 0 ? `/${rest.join("/")}` : "/";
}

export function localeFromPathname(pathname: string): Locale {
  const [, first] = pathname.split("/");
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

/** Metadata.alternates 用。canonical と hreflang をまとめて作る。 */
export function alternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
      "x-default": localePath(DEFAULT_LOCALE, path),
    },
  };
}
