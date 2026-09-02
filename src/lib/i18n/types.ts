import type { Locale } from "./config";

/**
 * 全ロケールの値を必ず持つ多言語値。
 *
 * 旧サイトは `{ en: string[]; ja: string[] }` のようにコレクションの外側で
 * 言語を分けていたため、EN と JA で要素数がずれても型が通ってしまった
 * (about.paragraphs が EN 4 段落 / JA 3 段落になっていた)。
 * Localized は必ず「葉」に置くこと ── `readonly Localized<string>[]` であって
 * `Localized<readonly string[]>` ではない。
 */
export type Localized<T> = { readonly [L in Locale]: T };

export type Translator = <T>(value: Localized<T>) => T;

/** 描画側で `const t = translator(locale)` として使う。 */
export function translator(locale: Locale): Translator {
  return <T,>(value: Localized<T>) => value[locale];
}

/** 単発で解決したいとき用。 */
export function pick<T>(locale: Locale, value: Localized<T>): T {
  return value[locale];
}
