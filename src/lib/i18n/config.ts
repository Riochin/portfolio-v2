/**
 * サイトが対応するロケール。
 * ここが Localized<T> の mapped type の元になっているので、
 * ロケールを足すと全ての Localized リテラルが型エラーになり、翻訳漏れが build で止まる。
 */
export const LOCALES = ["ja", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

/** og:locale 用の BCP 47 タグ */
export const OG_LOCALE: Record<Locale, string> = {
  ja: "ja_JP",
  en: "en_US",
};
