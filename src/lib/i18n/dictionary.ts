import type { Localized } from "./types";

type DictNode = Localized<string>;

/**
 * UI 文言の辞書。
 *
 * Next の docs はロケールごとの JSON + 動的 import を勧めているが採用しない:
 * - JSON を 2 ファイルに分けると静かに drift する。葉に両言語を置けば翻訳漏れが表現不能になる。
 * - docs の論拠はバンドルサイズだが、消費側は全て Server Component で辞書は 5KB 未満。
 * - resolveJsonModule は全値を string に潰すのでキーの網羅チェックが効かない。
 *
 * pages の値は generateMetadata と opengraph-image の両方が読む。
 * 以前はページタイトルが metadata.title と opengraph-image.tsx に二重に書かれていた。
 */
export const DICT = {
  nav: {
    about: { ja: "About me", en: "About me" },
    works: { ja: "Works", en: "Works" },
    experience: { ja: "Experience", en: "Experience" },
    output: { ja: "Output", en: "Output" },
  },
  pages: {
    about: { ja: "About me", en: "About me" },
    works: { ja: "Works", en: "Works" },
    experience: { ja: "Experience", en: "Experience" },
    output: { ja: "Output", en: "Output" },
  },
  output: {
    talks: { ja: "Talks", en: "Talks" },
    articles: { ja: "Articles", en: "Articles" },
    empty: { ja: "まだありません。", en: "Nothing here yet." },
  },
  works: {
    awards: { ja: "受賞歴", en: "Awards" },
    stack: { ja: "技術スタック", en: "Stack" },
    role: { ja: "担当", en: "Role" },
    related: { ja: "関連する経験", en: "Related experience" },
    back: { ja: "Works に戻る", en: "Back to Works" },
    // 単一リポジトリではなく Organization のトップを指す作品があるので
    // 「リポジトリ」とは名乗らない。
    repo: { ja: "ソースコード", en: "Source code" },
    demo: { ja: "デモ", en: "Live demo" },
    article: { ja: "紹介記事", en: "Write-up" },
    slides: { ja: "スライド", en: "Slides" },
  },
  /**
   * 作品の出自の見出し。キーは WorkCategory と同じにしてあるので、
   * カテゴリを増やすと参照側 (works/page.tsx) の索引で型エラーになる。
   */
  workCategories: {
    personal: { ja: "個人で開発したもの", en: "Built on my own" },
    hackathon: { ja: "ハッカソンで開発したもの", en: "Built at hackathons" },
  },
  about: {
    skills: { ja: "使っている技術", en: "Skills" },
    /** 上位再生曲なので「好きな曲」とは名乗らない。 */
    tracks: { ja: "よく聴いている曲", en: "On repeat" },
  },
  hero: {
    welcome: {
      ja: "Welcome to my portfolio",
      en: "Welcome to my portfolio",
    },
  },
  aria: {
    mainNav: { ja: "メインナビゲーション", en: "Main navigation" },
    openMenu: { ja: "メニューを開く", en: "Open menu" },
    closeMenu: { ja: "メニューを閉じる", en: "Close menu" },
    themeToggle: { ja: "テーマを切り替え", en: "Toggle theme" },
    languageToggle: { ja: "言語を切り替え", en: "Switch language" },
    expandHero: {
      ja: "空の演出を全画面で表示",
      en: "Show the sky scene fullscreen",
    },
    closeFullscreen: { ja: "全画面表示を閉じる", en: "Close fullscreen" },
  },
} as const satisfies Record<string, Record<string, DictNode>>;
