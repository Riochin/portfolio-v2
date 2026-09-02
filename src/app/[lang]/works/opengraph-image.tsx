import { renderOgImage, ogSize, ogContentType, ogAlt } from "@/lib/og";
import { DICT } from "@/lib/i18n/dictionary";
import { isLocale, DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/config";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * 画像ルートは Route Handler 扱いで next/root-params が使えないが、
 * params はルートセグメントから下まで解決されるので lang はここで受け取れる。
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  return renderOgImage({ title: DICT.pages.works[locale] });
}
