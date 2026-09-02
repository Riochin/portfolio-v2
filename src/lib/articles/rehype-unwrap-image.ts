import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

/**
 * 画像だけの段落から `<p>` を外す。
 *
 * Markdown 記法の画像 (`![](...)`) は段落の中に置かれるが、キャプション付きの
 * 画像は `<figure>` で包みたい。`<p>` の中に `<figure>` は入れられない
 * (ブラウザが段落を勝手に閉じて DOM がねじれる) ので、先にほどいておく。
 *
 * HTML で書かれた画像は remark が html ブロックとして扱うため元から段落に
 * 入らない。ここで揃うのは Markdown 記法のほうだけ。
 */
export function rehypeUnwrapImage() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "p" || !parent || index === undefined) return;

      // 空白だけのテキストは無視して、中身が img 1 つだけかを見る。
      const meaningful = node.children.filter(
        (child) =>
          !(child.type === "text" && child.value.trim() === "") &&
          child.type !== "comment",
      );
      if (meaningful.length !== 1) return;

      const only = meaningful[0];
      if (only.type !== "element" || only.tagName !== "img") return;

      parent.children[index] = only as Element;
    });
  };
}
