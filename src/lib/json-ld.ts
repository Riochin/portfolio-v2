import { ABOUT } from "@/data/about";
import { SITE, SOCIAL_LINKS } from "@/data/site";
import { articleExcerpt } from "@/lib/articles/excerpt";
import type { Article } from "@/lib/articles/types";
import { DICT } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/paths";

/**
 * schema.org の構造化データ (JSON-LD)。検索エンジンと AI エージェントに
 * 「誰のサイトで、このページが何か」を機械可読で渡す。
 *
 * トップは Person と WebSite、記事は BlogPosting を出す。Person は @id で
 * 1 つに束ね、記事の author と WebSite の publisher からはその @id を指す。
 * 値はすべて data/ と DICT から取る ── 画面の文言と食い違わないように。
 */

type JsonLdNode = { readonly "@type": string } & Record<string, unknown>;

export type JsonLd = { readonly "@context": "https://schema.org" } & (
  | JsonLdNode
  | { readonly "@graph": readonly JsonLdNode[] }
);

export const PERSON_ID = `${SITE.url}/#person`;
export const WEBSITE_ID = `${SITE.url}/#website`;

const absolute = (path: string) => `${SITE.url}${path}`;

/**
 * 本人と同一だと示すプロフィール。SNS アイコンに並ぶもの (SOCIAL_LINKS) に、
 * アイコンには出していないが記事を書いている Qiita を足す。
 */
export const SAME_AS: readonly string[] = [
  ...SOCIAL_LINKS.map((link) => link.href),
  `https://qiita.com/${SITE.accounts.qiita}`,
];

export function personJsonLd(locale: Locale): JsonLdNode {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE.name,
    alternateName: [SITE.brand, SITE.handle],
    description: ABOUT.summary[locale],
    url: absolute(localePath(locale, "/")),
    image: absolute(ABOUT.photo.src),
    jobTitle: DICT.home.role[locale],
    email: SITE.email,
    sameAs: SAME_AS,
  };
}

export function webSiteJsonLd(locale: Locale): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.brand,
    description: SITE.description[locale],
    url: absolute(localePath(locale, "/")),
    inLanguage: locale,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

/** トップに置く 1 本。Person と WebSite を @graph でまとめる。 */
export function homeJsonLd(locale: Locale): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [personJsonLd(locale), webSiteJsonLd(locale)],
  };
}

/**
 * 記事ページの BlogPosting。
 *
 * 記事は日本語単言語なので、/en で開いても inLanguage は ja のまま
 * (lib/articles/types.ts)。frontmatter に更新日を持たないので、
 * dateModified は公開日と同じにする。画像は記事ごとの OG 画像。
 */
export function blogPostingJsonLd(article: Article, locale: Locale): JsonLd {
  const url = absolute(localePath(locale, `/blog/${article.slug}`));
  const description = articleExcerpt(article.markdown);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: article.title,
    ...(description && { description }),
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    inLanguage: "ja",
    url,
    mainEntityOfPage: url,
    image: `${url}/opengraph-image`,
    author: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: SITE.name,
      url: absolute(localePath(locale, "/")),
    },
    publisher: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

/**
 * <script type="application/ld+json"> に入れる文字列。
 *
 * JSON.stringify は `</script>` を素通しするので、`<` を < に置き換えて
 * script 要素から抜け出せないようにする (Next の JSON-LD ガイドの勧め)。
 * JSON として読めば同じ文字に戻る。
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
