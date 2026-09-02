import { readFileSync } from "node:fs";
import { join, normalize, sep } from "node:path";
import { imageSize } from "image-size";
import { visit } from "unist-util-visit";
import type { Root } from "hast";

/**
 * 本文中の画像に実寸を刻む rehype プラグイン。
 *
 * Markdown の `![](/articles/foo/bar.webp)` は寸法を持てないが、next/image は
 * fill を使わない限り width / height を要求する (design.md: CLS を出さないため
 * intrinsic サイズで描く)。そこでビルド時に public/ の実ファイルから読んで
 * hast に載せ、MarkdownImage が受け取る。
 *
 * 寸法を Markdown 側に書かないのは、手で本文を直したときや画像を差し替えたときに
 * 数字だけ古くなるのを避けるため。ファイルが常に正しい。
 */

/**
 * 寸法を読みに行く拡張子。studio のアップロード口が受け付ける形式と揃える。
 *
 * 絞ってあるのは image-size の既知の脆弱性 (ICNS / JXL / HEIF パーサが
 * 無限ループする) を踏まないため。読むのは自分がアップロードしたファイルだけだが、
 * 緩和はアップロード口だけでなくここにも書いておく。
 */
const SIZEABLE = /\.(png|jpe?g|webp|gif|avif)$/i;

const PUBLIC_DIR = join(process.cwd(), "public");

/** public/ の中に収まる絶対パスに直す。外を指していたら undefined。 */
function resolveInPublic(src: string): string | undefined {
  // `//example.com/x.png` はプロトコル相対の外部 URL なので触らない。
  if (!src.startsWith("/") || src.startsWith("//")) return undefined;
  if (!SIZEABLE.test(src)) return undefined;

  const resolved = normalize(join(PUBLIC_DIR, decodeURIComponent(src)));
  return resolved.startsWith(PUBLIC_DIR + sep) ? resolved : undefined;
}

export function rehypeImageSize() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      const src = node.properties?.src;
      if (typeof src !== "string") return;

      const path = resolveInPublic(src);
      if (!path) return;

      try {
        const { width, height } = imageSize(readFileSync(path));
        if (width && height) {
          node.properties.width = width;
          node.properties.height = height;
        }
      } catch {
        // 読めない・寸法が分からない画像は寸法無しのまま通す。
        // 記事 1 枚のためにビルドを落とさない (MarkdownImage が素の img に落とす)。
      }
    });
  };
}
