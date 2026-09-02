import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

/**
 * エディタのコードブロック用の rose-pine-dawn。
 *
 * 公開後のライトモードは shiki の rose-pine-dawn で色が付く
 * (lib/articles/highlighter.ts)。書いている最中だけ別の配色だと、
 * 仕上がりを想像しながら書けない。shiki 側のテーマ定義には CodeMirror が
 * 読める形が無いので、同じ配色を張り直す。
 *
 * 色は @shikijs/themes/rose-pine-dawn の値と揃えてある。
 * 配色をそのまま書き写しているので、著作権表示は THIRD-PARTY-NOTICES.md に置いた
 * (Rosé Pine / MIT)。
 */
export const rosePineDawn = createTheme({
  theme: "light",
  settings: {
    background: "#faf4ed",
    foreground: "#575279",
    caret: "#575279",
    selection: "#dfdad9",
    selectionMatch: "#dfdad9",
    lineHighlight: "#f2e9e1",
    gutterBackground: "#faf4ed",
    gutterForeground: "#9893a5",
  },
  styles: [
    { tag: [t.comment], color: "#9893a5", fontStyle: "italic" },
    { tag: [t.keyword, t.operator, t.moduleKeyword], color: "#286983" },
    { tag: [t.string, t.special(t.string)], color: "#ea9d34" },
    { tag: [t.number, t.bool, t.null], color: "#d7827e" },
    { tag: [t.function(t.variableName), t.labelName], color: "#b4637a" },
    { tag: [t.definition(t.variableName), t.variableName], color: "#575279" },
    { tag: [t.propertyName], color: "#907aa9" },
    { tag: [t.typeName, t.className, t.tagName], color: "#56949f" },
    { tag: [t.attributeName], color: "#907aa9" },
    { tag: [t.punctuation, t.bracket], color: "#797593" },
    { tag: [t.invalid], color: "#b4637a" },
  ],
});
