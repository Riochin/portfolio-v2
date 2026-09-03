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
  /** ページをまたいで同じ意味で使う文言。 */
  common: {
    showMore: { ja: "もっとみる", en: "Show more" },
    showLess: { ja: "とじる", en: "Show less" },
  },
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
    talks: { ja: "登壇資料", en: "Talks" },
    articles: { ja: "書いた記事", en: "Articles" },
    empty: { ja: "まだありません。", en: "Nothing here yet." },
  },
  /**
   * 自前記事 (content/articles/*.md) の詳細ページ。
   * 一覧は独立させず /output の「書いた記事」に混ぜているので、戻り先も Output。
   */
  blog: {
    back: { ja: "Output に戻る", en: "Back to Output" },
    /** 末尾のページャの行き先。上部の back と役割が違うので言い分ける
     *  ── 上は読み始める前の離脱口、下は読み終えたあとの次の一手。
     *  行き先は /output だが「Output」とは名乗らない。読み終えた直後に
     *  誘いたいのは同じ「読みもの」なので、記事の側から呼ぶ。 */
    otherArticles: { ja: "ほかの記事も見る", en: "See other articles" },
    draft: { ja: "下書き", en: "Draft" },
  },
  works: {
    awards: { ja: "受賞歴", en: "Awards" },
    stack: { ja: "技術スタック", en: "Stack" },
    role: { ja: "担当", en: "Role" },
    related: { ja: "関連する経験", en: "Related experience" },
    back: { ja: "Works に戻る", en: "Back to Works" },
    /** 末尾のページャの行き先。blog.otherArticles と同じ理由で back とは別語。 */
    otherWorks: { ja: "ほかの作品も見る", en: "See other works" },
    // 単一リポジトリではなく Organization のトップを指す作品があるので
    // 「リポジトリ」とは名乗らない。
    repo: { ja: "ソースコード", en: "Source code" },
    demo: { ja: "デモ", en: "Live demo" },
    article: { ja: "紹介記事", en: "Write-up" },
    slides: { ja: "スライド", en: "Slides" },
  },
  experience: {
    /** 経験カードから外部記事へ飛ばすリンクのラベル。 */
    report: { ja: "参加体験記", en: "Write-up" },
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
    /** 「使っている」ではなく「勉強している」。習得済みの一覧ではなく、
     *  いま手を動かして覚えている最中のものを並べる枠なので。 */
    skills: { ja: "勉強している技術", en: "Currently learning" },
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
    pager: { ja: "前後のページ", en: "Previous and next pages" },
    openMenu: { ja: "メニューを開く", en: "Open menu" },
    closeMenu: { ja: "メニューを閉じる", en: "Close menu" },
    themeToggle: { ja: "テーマを切り替え", en: "Toggle theme" },
    languageToggle: { ja: "言語を切り替え", en: "Switch language" },
    expandHero: {
      ja: "空の演出を全画面で表示",
      en: "Show the sky scene fullscreen",
    },
    closeFullscreen: { ja: "全画面表示を閉じる", en: "Close fullscreen" },
    expandPhoto: {
      ja: "プロフィール写真を拡大表示",
      en: "Enlarge the profile photo",
    },
    closePhoto: { ja: "拡大表示を閉じる", en: "Close the enlarged photo" },
  },
} as const satisfies Record<string, Record<string, DictNode>>;
