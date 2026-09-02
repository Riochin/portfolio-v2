import { visit } from "unist-util-visit";
import type { Root } from "hast";

/**
 * コードブロックの言語名を小文字に均す。shiki より前に走らせる。
 *
 * shiki の言語 ID は小文字固定で、` ```Java ` のように大文字で書かれると
 * 引けずに fallbackLanguage (text) へ落ちる ── 色が一切付かないのに
 * エラーも出ないので、書いた側からは「テーマが効かない」ようにしか見えない。
 * 言語名の大小は書き手が気にすることではないので、ここで吸収する。
 */
export function rehypeLowercaseLang() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "code") return;

      const className = node.properties?.className;
      if (!Array.isArray(className)) return;

      node.properties.className = className.map((name) =>
        typeof name === "string" && name.startsWith("language-")
          ? name.toLowerCase()
          : name,
      );
    });
  };
}
