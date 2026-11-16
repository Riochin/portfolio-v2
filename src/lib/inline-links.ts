/**
 * データに書いた段落の中のリンク (`[文字](/works/off)`) を切り出す。
 *
 * 作品の本文は Markdown として扱うほどの書式は要らないが、ほかの作品や
 * ページへのリンクだけは文中に置きたい。詳細ページ (React) と Markdown 出力の
 * 両方がここで分けた結果を使うので、書き方の解釈が 2 か所でずれない。
 */

export type InlineSegment =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "link"; readonly text: string; readonly href: string };

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export function splitInlineLinks(source: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let last = 0;
  for (const match of source.matchAll(LINK)) {
    const index = match.index;
    if (index > last) {
      segments.push({ kind: "text", text: source.slice(last, index) });
    }
    segments.push({ kind: "link", text: match[1], href: match[2] });
    last = index + match[0].length;
  }
  if (last < source.length) {
    segments.push({ kind: "text", text: source.slice(last) });
  }
  return segments;
}

/** `/works/off` のようなサイト内のパス。ロケールの接頭辞は付けずに書く。 */
export function isSitePath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}
