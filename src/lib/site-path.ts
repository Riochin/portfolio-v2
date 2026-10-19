import { SITE } from "@/data/site";

/**
 * サイト内を指す href なら、そのパス (`/` 始まり) を返す。外部なら undefined。
 *
 * 本文には `/ja/works/...` のような相対パスだけでなく、
 * `https://riochin.dev/ja/works/...` と絶対 URL で書かれたものも混ざる。
 * どちらも同じサイトなので、外部リンクの印や別タブの判断を揃えるためにここで寄せる。
 * `//example.com/x` はプロトコル相対の外部 URL なので外す。
 */
export function sitePath(href: string): string | undefined {
  if (href === SITE.url) return "/";
  if (href.startsWith(`${SITE.url}/`)) return href.slice(SITE.url.length);
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return undefined;
}
