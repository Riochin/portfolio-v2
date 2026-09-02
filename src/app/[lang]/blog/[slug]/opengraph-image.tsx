import {
  renderArticleOgImage,
  renderOgImage,
  ogSize,
  ogContentType,
  ogAlt,
} from "@/lib/og";
import { getArticleBySlug, getArticleSlugs } from "@/lib/articles";
import { LOCALES } from "@/lib/i18n/config";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    getArticleSlugs().map((slug) => ({ lang, slug })),
  );
}

/**
 * 画像ルートは Route Handler 扱いで next/root-params が使えないが、
 * params はルートセグメントから下まで解決されるので lang / slug ともにここで取れる。
 *
 * 記事は日本語単言語なので、works と違ってロケールでタイトルを出し分けない。
 * この画像は OGP であると同時に /output のタイル用サムネイルでもある。
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  // 本番では dynamicParams = false なので記事が引けないことは無いが、
  // dev で存在しない slug を直接叩いたときは共通の表紙に落とす。
  return article
    ? renderArticleOgImage({ title: article.title })
    : renderOgImage();
}
