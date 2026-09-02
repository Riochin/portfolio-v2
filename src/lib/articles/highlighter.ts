import "server-only";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import dracula from "@shikijs/themes/dracula";
import rosePineDawn from "@shikijs/themes/rose-pine-dawn";

import bash from "@shikijs/langs/bash";
import c from "@shikijs/langs/c";
import cpp from "@shikijs/langs/cpp";
import csharp from "@shikijs/langs/csharp";
import css from "@shikijs/langs/css";
import dart from "@shikijs/langs/dart";
import diff from "@shikijs/langs/diff";
import docker from "@shikijs/langs/docker";
import go from "@shikijs/langs/go";
import graphql from "@shikijs/langs/graphql";
import html from "@shikijs/langs/html";
import java from "@shikijs/langs/java";
import javascript from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import jsx from "@shikijs/langs/jsx";
import kotlin from "@shikijs/langs/kotlin";
import markdown from "@shikijs/langs/markdown";
import php from "@shikijs/langs/php";
import prisma from "@shikijs/langs/prisma";
import python from "@shikijs/langs/python";
import ruby from "@shikijs/langs/ruby";
import rust from "@shikijs/langs/rust";
import scss from "@shikijs/langs/scss";
import sql from "@shikijs/langs/sql";
import svelte from "@shikijs/langs/svelte";
import swift from "@shikijs/langs/swift";
import toml from "@shikijs/langs/toml";
import tsx from "@shikijs/langs/tsx";
import typescript from "@shikijs/langs/typescript";
import vue from "@shikijs/langs/vue";
import xml from "@shikijs/langs/xml";
import yaml from "@shikijs/langs/yaml";

/**
 * 記事のコードブロックを Dracula で色付けするハイライタ。ビルド時にだけ動く。
 *
 * shiki を丸ごと (`shiki` の既定 bundle) 入れると言語定義だけで 8MB を超えるので、
 * core に必要な言語とテーマだけを明示的に積む。
 *
 * **未登録の言語には色が付かない。** fallbackLanguage で text に落ちるだけなので
 * 本文は普通に出るが、書いた本人には「テーマが効いていない」ようにしか見えない
 * (実際に Java でそうなった)。使いそうなものは先に入れておく ── 1 つ数十 KB で、
 * 読むのはビルド時だけ。
 *
 * 正規表現エンジンも WASM (oniguruma) ではなく JS 実装を使う。
 * WASM を積まないぶんサーバー側のバンドルが軽く、ビルド時の色付けには十分速い。
 * forgiving にしてあるのは、JS エンジンが解せない文法が 1 つあっても
 * 記事 1 本のためにビルドを落とさないため (その言語だけ色が付かない)。
 */
const LANGS = [
  bash,
  c,
  cpp,
  csharp,
  css,
  dart,
  diff,
  docker,
  go,
  graphql,
  html,
  java,
  javascript,
  json,
  jsx,
  kotlin,
  markdown,
  php,
  prisma,
  python,
  ruby,
  rust,
  scss,
  sql,
  svelte,
  swift,
  toml,
  tsx,
  typescript,
  vue,
  xml,
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
 * どちらも MIT。色の値を公開ページの HTML に焼き込んで配ることになるので、
 * 著作権表示はリポジトリ直下の THIRD-PARTY-NOTICES.md に置いてある。
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
