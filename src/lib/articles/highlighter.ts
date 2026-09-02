import "server-only";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import dracula from "@shikijs/themes/dracula";
import rosePineDawn from "@shikijs/themes/rose-pine-dawn";

import bash from "@shikijs/langs/bash";
import css from "@shikijs/langs/css";
import go from "@shikijs/langs/go";
import html from "@shikijs/langs/html";
import javascript from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import jsx from "@shikijs/langs/jsx";
import markdown from "@shikijs/langs/markdown";
import python from "@shikijs/langs/python";
import sql from "@shikijs/langs/sql";
import tsx from "@shikijs/langs/tsx";
import typescript from "@shikijs/langs/typescript";
import yaml from "@shikijs/langs/yaml";

/**
 * 記事のコードブロックを Dracula で色付けするハイライタ。ビルド時にだけ動く。
 *
 * shiki を丸ごと (`shiki` の既定 bundle) 入れると言語定義だけで 8MB を超えるので、
 * core に必要な言語とテーマだけを明示的に積む。書くのが web 中心なので
 * この 13 言語で足りる ── 増やしたくなったらここに 1 行足す。
 * 未登録の言語で囲まれたブロックは色が付かないだけで、本文は普通に出る。
 *
 * 正規表現エンジンも WASM (oniguruma) ではなく JS 実装を使う。
 * WASM を積まないぶんサーバー側のバンドルが軽く、ビルド時の色付けには十分速い。
 * forgiving にしてあるのは、JS エンジンが解せない文法が 1 つあっても
 * 記事 1 本のためにビルドを落とさないため (その言語だけ色が付かない)。
 */
const LANGS = [
  bash,
  css,
  go,
  html,
  javascript,
  json,
  jsx,
  markdown,
  python,
  sql,
  tsx,
  typescript,
  yaml,
];

/**
 * ライトとダークで別のテーマを焼く。
 *
 * ダークは Dracula。ライトは rose-pine-dawn ── 背景 #faf4ed がサイトの地色
 * #fbf3f5 とほぼ同じ暖かい白で、基本の文字が紫 (#575279)、キーワードが青
 * (#286983)、関数がピンク (#b4637a) と、このサイトのアクセントの取り合わせに
 * そのまま乗る。catppuccin-latte も候補だったが、橙のキーワードと緑の文字列が
 * 出るので採らなかった。
 *
 * 2 つとも 1 回の変換で焼き、色は CSS 変数として両方 HTML に載る
 * (defaultColor: false)。切り替えは globals.css の .dark が行うので、
 * 実行時の再変換もクライアント側の JS も要らない。
 */
export const CODE_THEMES = { light: "rose-pine-dawn", dark: "dracula" } as const;

/** 生成は 1 回きり。記事の本数だけ文法を読み直さない。 */
let instance: Promise<HighlighterCore> | undefined;

export function getHighlighter(): Promise<HighlighterCore> {
  instance ??= createHighlighterCore({
    themes: [rosePineDawn, dracula],
    langs: LANGS,
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return instance;
}
