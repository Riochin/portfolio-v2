import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { translator, type Translator } from "./types";

/**
 * next/root-params を使う唯一のファイル。
 *
 * ルートレイアウトが app/[lang]/layout.tsx にあるので、lang はルートパラメータになり
 * 任意の Server Component / サーバーユーティリティから prop drilling なしで読める。
 * Client Component / Server Action / Route Handler では使えない点に注意
 * (opengraph-image.tsx は Route Handler 扱いなので、そちらは params から受け取る)。
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getT(): Promise<{ locale: Locale; t: Translator }> {
  const locale = await getLocale();
  return { locale, t: translator(locale) };
}
