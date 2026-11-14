import { LOCALES, type Locale } from "./i18n/config";
import { localePath } from "./i18n/paths";

/**
 * エージェント向けの Link レスポンスヘッダー (RFC 8288)。
 *
 * HTML の <link> と同じことをヘッダーでも言う。本文を読まずに、
 * サイトマップ・llms.txt・同じページの Markdown 版・別ロケール版へ
 * たどれるようにする。rel はどれも IANA の Link Relations に載っているもの。
 *
 * next.config.ts の headers() がこれを読む。proxy.ts では付けない
 * (proxy はリダイレクト専用のままにしておく)。
 */

type HeaderRule = {
  source: string;
  headers: { key: string; value: string }[];
};

/** ページの種類を問わず付ける分。 */
const SITE_LINKS = [
  `</sitemap.xml>; rel="sitemap"`,
  `</llms.txt>; rel="describedby"; type="text/plain"`,
];

/**
 * Link を付けるページ (ロケール接頭辞なし)。トップ・ブログ一覧 (/output)・記事。
 * :slug は next.config の headers() が値の中でも置き換えるので、
 * 記事ごとに自分の URL を指せる。
 */
export const LINKED_PATHS = ["/", "/output", "/blog/:slug"] as const;

/** 1 ページ分の Link の値。カンマ区切りで 1 本にまとめる (RFC 8288 §3)。 */
export function linkValue(locale: Locale, path: string): string {
  const self = localePath(locale, path);
  return [
    ...SITE_LINKS,
    // Accept: text/markdown で同じ URL が Markdown を返す。
    `<${self}>; rel="alternate"; type="text/markdown"`,
    ...LOCALES.filter((l) => l !== locale).map(
      (l) => `<${localePath(l, path)}>; rel="alternate"; hreflang="${l}"`,
    ),
  ].join(", ");
}

export function linkHeaders(): HeaderRule[] {
  return [
    // / は proxy が /ja か /en へリダイレクトする。リダイレクトを追わない
    // クライアントにも、サイト全体の分だけは見せておく。
    { source: "/", headers: [{ key: "Link", value: SITE_LINKS.join(", ") }] },
    ...LOCALES.flatMap((locale) =>
      LINKED_PATHS.map((path) => ({
        source: localePath(locale, path),
        headers: [{ key: "Link", value: linkValue(locale, path) }],
      })),
    ),
  ];
}
