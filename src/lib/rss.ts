import { SITE } from "@/data/site";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { FEED_PATH, localePath } from "@/lib/i18n/paths";
import type { Article } from "@/lib/articles/types";

/**
 * 自前記事の RSS 2.0 (/feed.xml)。
 *
 * Findy などのサービスは、ブログの URL を渡されると <head> の
 * rel="alternate" type="application/rss+xml" からこれを見つけて記事を読む。
 * フィードが無いと「ブログが見つかりません」になる。
 *
 * llms-txt と同じく純粋関数にして、記事は引数で受ける。
 * 記事は日本語単言語 (lib/articles/types.ts) なので、リンクは既定ロケールに寄せる。
 */

/** 公開済みだけを渡すこと。下書きは URL を知っている本人だけが読むもの。 */
export type RssArticle = Pick<Article, "slug" | "title" | "publishedAt">;

const url = (path: string) => `${SITE.url}${path}`;

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** "2026-09-03" を日本時間の 0 時として RFC 822 の日付にする。 */
export function toRfc822(yearMonthDay: string): string {
  return new Date(`${yearMonthDay}T00:00:00+09:00`).toUTCString();
}

function item(article: RssArticle): string {
  const link = url(localePath(DEFAULT_LOCALE, `/blog/${article.slug}`));
  return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${toRfc822(article.publishedAt)}</pubDate>
    </item>`;
}

/** articles は公開日の新しい順 (getPublishedArticles の並び) で渡す。 */
export function buildRss(articles: readonly RssArticle[]): string {
  const [latest] = articles;
  const lastBuildDate = latest
    ? `\n    <lastBuildDate>${toRfc822(latest.publishedAt)}</lastBuildDate>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.brand)}</title>
    <link>${url(localePath(DEFAULT_LOCALE, "/output"))}</link>
    <description>${escapeXml(SITE.description.ja)}</description>
    <language>ja</language>
    <atom:link href="${url(FEED_PATH)}" rel="self" type="application/rss+xml"/>${lastBuildDate}
${articles.map(item).join("\n")}
  </channel>
</rss>
`;
}
