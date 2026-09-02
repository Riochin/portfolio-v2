import { visit } from "unist-util-visit";
import type { Root } from "hast";

/**
 * 本文中の h1 を h2 に落とす。
 *
 * 記事ページの h1 はタイトル (page.tsx が描く) の 1 つだけにしたい。本文にも
 * h1 があると、読み上げや検索エンジンから見て見出しが 2 つある形になる。
 *
 * studio 側でも h1 は出せないようにしてあるが (スラッシュメニューから外し、
 * 見た目も h2 と同じにしてある)、`# ` と打つ Markdown の入力ルールまでは
 * 塞げないし、手で書いたファイルや他所からの貼り付けもある。
 * ここが最後の保証になる。
 *
 * h2 以下はずらさない。本文の h1 は他の章と同じ高さの見出しとして扱えば足り、
 * 全体を 1 段ずつ繰り下げると既にある階層のほうが壊れる。
 */
export function rehypeDemoteH1() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "h1") node.tagName = "h2";
    });
  };
}
