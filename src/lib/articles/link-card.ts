import { getArticleBySlug } from "@/lib/articles";
import { localePath, stripLocale } from "@/lib/i18n/paths";
import { fetchHeadMeta } from "@/lib/meta-tags";
import { SITE } from "@/data/site";
import type { Locale } from "@/lib/i18n/config";

/**
 * 本文中の単独行の URL を置き換えるカードのデータ。
 *
 * ここだけロケールを引数に取る ── lib/articles/index.ts は OG 画像から呼べるよう
 * 「全て同期・ロケール非依存」を守る必要があるが、カードのリンク先は
 * ロケール接頭辞付きでなければならない。lib/output/self.ts が /output の一覧に
 * 対してやっているのと同じで、その変換をこの層で閉じる。
 */
export type LinkCard = {
  /** 遷移先。サイト内はロケール接頭辞付きに直したもの。 */
  readonly href: string;
  readonly title: string;
  readonly description?: string;
  readonly image?: string;
  readonly siteName: string;
  /** サイト内なら next/link で送る。LinkCard が分岐に使う。 */
  readonly internal: boolean;
};

/**
 * 属性に載せる文字数の上限。
 *
 * 説明文は長いサイトだと数百字あり、そのまま data 属性に入れると
 * 表示は 2 行で切られるのに HTML だけが太る。カードに出る分だけ持つ。
 */
const MAX_TITLE = 150;
const MAX_DESCRIPTION = 200;

const clamp = (value: string, max: number) => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
};

/** サイト内の記事へのリンクか。合えば `/blog/<slug>` の slug。 */
const BLOG_PATH = /^\/blog\/([^/]+)$/;

function internalArticleSlug(href: string): string | undefined {
  let path: string;
  if (href.startsWith(`${SITE.url}/`) || href === SITE.url) {
    path = href.slice(SITE.url.length) || "/";
  } else if (href.startsWith("/") && !href.startsWith("//")) {
    // `//example.com/x` はプロトコル相対の外部 URL なので外す。
    path = href;
  } else {
    return undefined;
  }

  // クエリとフラグメントは記事の同定に関係しない。
  const [pathname] = path.split(/[?#]/);
  return BLOG_PATH.exec(stripLocale(pathname))?.[1];
}

/**
 * サイト内の記事のカード。外部への fetch は起きない。
 *
 * サムネイルは記事自身の OG 画像ルート。lib/output/self.ts と同じ組み立て方で、
 * /output の一覧に並ぶタイルと同じ絵がそのままカードにも出る。
 *
 * 記事以外のサイト内リンク (/works/... など) はここで undefined に落ち、
 * 今までどおりの素のリンクとして残る。カードに出せるだけの情報を
 * 同期で引ける先が、いまは記事しかないため。
 */
export function resolveInternalCard(
  href: string,
  locale: Locale,
): LinkCard | undefined {
  const slug = internalArticleSlug(href);
  if (!slug) return undefined;

  const article = getArticleBySlug(slug);
  if (!article) return undefined;

  return {
    href: localePath(locale, `/blog/${article.slug}`),
    title: clamp(article.title, MAX_TITLE),
    image: localePath(locale, `/blog/${article.slug}/opengraph-image`),
    siteName: SITE.wordmark,
    internal: true,
  };
}

/** 相対 URL をページ基準で絶対にし、https に揃える。 */
function absoluteImage(value: string | undefined, base: string) {
  if (!value) return undefined;
  try {
    const resolved = new URL(value, base);

    // http のままだとこのサイト (https) では混在コンテンツとして弾かれる。
    // 捨てずに https へ上げるのは、実際に http で宣言しながら https でも
    // 配っているサイトが多いため (milkdown.dev の og:image がそれ)。
    // 上げた先が繋がらなければ画像が出ないだけで、捨てた場合と結果は同じ ──
    // 上げるほうに損がない。
    if (resolved.protocol === "http:") resolved.protocol = "https:";
    return resolved.protocol === "https:" ? resolved.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 外部ページのカード。ビルド時に 1 回だけ取りに行く。
 *
 * cache は force-cache で、revalidate は**付けない**。付けると記事ページが
 * /output と同じく ISR になり、実行時に他所のサイトを取りに行くようになる。
 * 記事は完全な静的ページのままにしたい。force-cache なら ja / en 2 ロケール分の
 * プリレンダでも同じ URL を 2 度叩かずに済む。
 *
 * タイトルが取れないページはカードにしない (undefined を返す) ──
 * URL だけが載った空のカードより、素のリンクのほうが読める。
 */
export async function fetchExternalCard(
  url: string,
): Promise<LinkCard | undefined> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return undefined;
  }

  const head = await fetchHeadMeta(url, { cache: "force-cache" }, "link-card");
  if (!head) return undefined;

  const { meta } = head;
  const title =
    meta.get("og:title") ?? meta.get("twitter:title") ?? head.title ?? "";
  if (!title.trim()) return undefined;

  const description =
    meta.get("og:description") ??
    meta.get("twitter:description") ??
    meta.get("description");

  return {
    href: url,
    title: clamp(title, MAX_TITLE),
    description: description?.trim()
      ? clamp(description, MAX_DESCRIPTION)
      : undefined,
    image:
      absoluteImage(meta.get("og:image"), url) ??
      absoluteImage(meta.get("twitter:image"), url),
    siteName: meta.get("og:site_name")?.trim()
      ? clamp(meta.get("og:site_name")!, MAX_TITLE)
      : parsed.hostname.replace(/^www\./, ""),
    internal: false,
  };
}
