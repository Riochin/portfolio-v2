/**
 * Accept ヘッダーを見て、HTML より Markdown を欲しがっているかを決める。
 *
 * proxy と next.config.ts から読むので、i18n/config 以外に依存を持たない。
 *
 * 決まりは「text/markdown の q が text/html の q 以上なら Markdown」。
 * - ブラウザは text/markdown を送らないので、必ず HTML のまま。
 * - `*\/*` は HTML 扱い (今までどおり HTML を返す)。text/markdown を
 *   名指ししたときだけ Markdown にする。
 * - 同じ q なら、わざわざ text/markdown を書いた側の意図を汲んで Markdown。
 */

// next.config.ts からも読むので @/ ではなく相対パス。
import { LOCALES } from "../i18n/config";

/** 振り分け先の route handler の置き場所。proxy がここへ rewrite する。 */
export const MARKDOWN_ROUTE_PREFIX = "/markdown";

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

/**
 * HTML のページにも `Vary: Accept` を付ける next.config.ts の headers() の規則。
 * 同じ URL が Accept で HTML と Markdown に分かれることをキャッシュに伝える。
 *
 * proxy で付けない理由: ページの描画が `res.setHeader("Vary", …)` で
 * Next 自前の値 (rsc, next-router-state-tree, …) に置き換えるので、proxy の
 * 応答ヘッダーは消える (build/templates/app-page-runtime.js)。
 * next.config の headers() も `next start` では同じく消えるが、Vercel では
 * プラットフォームのルーティングが応答に載せる。
 *
 * 値に Next 自前の 4 つも並べるのは、プラットフォームが Vary を足すのか
 * 置き換えるのかに依らず、RSC の振り分け (rsc ヘッダー) を落とさないため。
 * Markdown 側は route handler 自身も Vary: Accept を付ける。
 */
export const VARY_ACCEPT_HEADERS = [
  {
    source: `/:lang(${LOCALES.join("|")})/:path*`,
    headers: [
      {
        key: "Vary",
        value:
          "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept",
      },
    ],
  },
];

function qualities(header: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const part of header.split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    if (!type) continue;
    const q = params
      .map((param) => param.trim())
      .find((param) => param.startsWith("q="));
    const value = q ? Number(q.slice(2)) : 1;
    // 同じ型が 2 回来たら高い方。壊れた q は 0 (= 受け付けない) とみなす。
    const quality = Number.isFinite(value) ? value : 0;
    map.set(type.trim(), Math.max(map.get(type.trim()) ?? 0, quality));
  }
  return map;
}

export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const q = qualities(accept);
  const markdown = q.get("text/markdown") ?? 0;
  if (markdown <= 0) return false;
  const html = q.get("text/html") ?? 0;
  return markdown >= html;
}
