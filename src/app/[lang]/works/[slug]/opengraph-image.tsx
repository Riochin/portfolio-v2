import { renderOgImage, ogSize, ogContentType, ogAlt } from "@/lib/og";
import { getWorkBySlug, getWorkSlugs } from "@/data";
import { isLocale, DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/config";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    getWorkSlugs().map((slug) => ({ lang, slug })),
  );
}

/**
 * 画像ルートは Route Handler 扱いで next/root-params が使えないが、
 * params はルートセグメントから下まで解決されるので lang / slug ともにここで取れる。
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const work = getWorkBySlug(slug);

  return renderOgImage({ title: work && work.title[locale] });
}
