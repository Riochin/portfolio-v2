import { decodeEntities } from "@/lib/meta-tags";

/** 抜き出す文字数の目安。検索結果の説明文に収まる長さ。 */
const MAX_LENGTH = 120;

/**
 * 記事の本文から、説明文に使う冒頭の地の文を抜き出す。
 *
 * frontmatter に description を持たないので、JSON-LD の description は
 * 本文の頭から作る。見出し・コードブロック・画像・HTML だけの行 (<br /> など) は
 * 地の文ではないので飛ばし、リンクと強調は記法を外して文字だけ残す。
 * studio のエディタは行頭の和文を `&#x3068;` のような数値参照で書き出すので、
 * それも戻す。
 */
export function articleExcerpt(markdown: string): string {
  const lines: string[] = [];
  let inFence = false;

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || line === "") continue;
    // 見出し・引用・表・水平線・HTML だけの行・画像だけの行
    if (/^(#{1,6}\s|>|\||[-*_]{3,}$)/.test(line)) continue;
    if (/^(<[^>]+>\s*)+$/.test(line)) continue;
    if (/^!\[[^\]]*\]\([^)]*\)$/.test(line)) continue;

    const text = decodeEntities(
      line
        .replace(/^([-*+]|\d+\.)\s+/, "")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/(\*\*|__|~~|`)/g, "")
        .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2"),
    ).trim();
    if (text === "") continue;

    lines.push(text);
    if (lines.join("").length >= MAX_LENGTH) break;
  }

  const joined = lines.join("");
  const chars = Array.from(joined);
  return chars.length > MAX_LENGTH
    ? `${chars.slice(0, MAX_LENGTH).join("")}…`
    : joined;
}
