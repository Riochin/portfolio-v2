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
    /** 詳細ページ上部の戻るリンク。一覧以外 (トップなど) から来たときは
     *  行き先が一覧ではないので、「作品一覧に戻る」ではなくこれを出す。 */
    back: { ja: "戻る", en: "Back" },
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
    /** 上部の戻るリンク。行き先はページ名 (Output) ではなく中身で呼ぶ ──
     *  Output は登壇資料と記事が混ざっていて、戻りたいのは記事の並びなので。 */
    back: { ja: "記事一覧に戻る", en: "Back to articles" },
    /** 末尾のページャの行き先。上部の back と役割が違うので言い分ける
     *  ── 上は読み始める前の離脱口、下は読み終えたあとの次の一手。
     *  行き先は /output だが「Output」とは名乗らない。読み終えた直後に
     *  誘いたいのは同じ「読みもの」なので、記事の側から呼ぶ。 */
    otherArticles: { ja: "ほかの記事も見る", en: "See other articles" },
    draft: { ja: "下書き", en: "Draft" },
    /** 末尾のシェア。行き先を名乗らず所作だけを言う ── 何に送るかは OS の
     *  共有シートが決めるので、こちらから約束できない (ArticleShare.tsx)。 */
    share: { ja: "この記事をシェア", en: "Share this article" },
    /** 共有シートが無い環境で share と入れ替わる。 */
    copyLink: { ja: "リンクをコピー", en: "Copy link" },
    copied: { ja: "コピーしました", en: "Copied" },
  },
  works: {
    awards: { ja: "受賞歴", en: "Awards" },
    stack: { ja: "技術スタック", en: "Stack" },
    role: { ja: "担当", en: "Role" },
    related: { ja: "関連する経験", en: "Related experience" },
    /** 上部の戻るリンク。blog.back と同じく、ページ名ではなく中身で呼ぶ。 */
    back: { ja: "作品一覧に戻る", en: "Back to works" },
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
    /** 中身の見出し。ページ名 (pages.experience) は英語のまま、中身の見出しは
     *  日本語にする (「主な作品」「登壇資料」と同じ決まり)。トップと
     *  Experience ページで共通。 */
    heading: { ja: "経歴", en: "Experience" },
    /** 経験カードから外部記事へ飛ばすリンクのラベル。 */
    report: { ja: "参加体験記", en: "Write-up" },
  },
  /**
   * 作品の出自の見出し。キーは WorkCategory と同じにしてあるので、
   * カテゴリを増やすと参照側 (works/page.tsx) の索引で型エラーになる。
   */
  workCategories: {
    personal: { ja: "個人で開発した作品", en: "Built on my own" },
    hackathon: { ja: "ハッカソンで開発した作品", en: "Built at hackathons" },
  },
  /** トップのヒーローの下 (簡易プロフィールと Featured works)。 */
  home: {
    role: { ja: "Software engineer", en: "Software engineer" },
    /** 続きへのリンクは行き先の名前ではなく動作で言う (blog.otherArticles と
     *  同じ型)。ページ名 (About me / Works) にすると、押す理由が伝わらない。 */
    more: { ja: "自己紹介を読む", en: "Read about me" },
    allExperience: { ja: "すべての経歴を見る", en: "See all experience" },
    featured: { ja: "主な作品", en: "Featured works" },
    allWorks: { ja: "すべての作品を見る", en: "See all works" },
    recentTalks: { ja: "最近の登壇資料", en: "Recent talks" },
    allTalks: { ja: "すべての登壇資料を見る", en: "See all talks" },
    recentArticles: { ja: "最近書いた記事", en: "Recent articles" },
    allArticles: { ja: "すべての記事を見る", en: "See all articles" },
  },
  about: {
    /** 「使っている」ではなく「勉強している」。習得済みの一覧ではなく、
     *  いま手を動かして覚えている最中のものを並べる枠なので。 */
    skills: { ja: "勉強している技術", en: "Currently learning" },
    /** 上位再生曲なので「好きな曲」とは名乗らない。 */
    tracks: { ja: "よく聴いている曲", en: "On repeat" },
  },
  /**
   * 見つからなかったときの画面 (app/[lang]/not-found.tsx)。
   *
   * 見出しは「迷子になってしまいましたか」ではなく問いかけ 1 語で置く ──
   * 迷ったのは読み手の落ち度ではないので、長く言うほど詫びさせる形になる。
   * 何が起きたかの説明は message が引き受けるので、見出しは声だけでいい。
   */
  notFound: {
    title: { ja: "迷子？", en: "Lost?" },
    message: {
      ja: "お探しのページは、移動または削除された可能性があります。",
      en: "The page you're looking for may have moved or been removed.",
    },
    /** 戻り先はトップ 1 本だけ。迷っている人に選択肢を並べても選べない。 */
    home: { ja: "トップに戻る", en: "Back to home" },
  },
  hero: {
    /**
     * 挨拶文。昼も夜も同じ 1 本。
     *
     * 一度は `Welcome to a sea that is nowhere.` (海への招待) にしていた。
     * 作品集に招かれても嬉しくないが海に招かれたら嬉しい、あの空が実在しない
     * 海の心象風景だと一行も書かれていないと、ただの綺麗な背景に見える ──
     * という理由だった。
     *
     * `Welcome to my portfolio` に戻したのは、トップで自己紹介の文脈を強めたい
     * から。海の下に経歴・作品・登壇・記事を並べ、トップだけで「どんな人か」が
     * 伝わるようにした回 (feat/home-journey) で、入口の一行も「ここは誰かの
     * ポートフォリオだ」と先に言う側に寄せた。海の出自は、全画面に入れば
     * Riochin が語る (narration) ので、そちらに任せる。
     *
     * **ロケールによらず en を出す。**ここだけは日本語ページでも英語のまま。
     * 消費側 (page.tsx) が t() を通さず `.en` を直に読むので、下の ja は
     * 画面には出ない ── 型 (Localized) が両言語を要求するので置いてあり、
     * 意味の原文としては生きている。英語だけにする理由と、文書の lang と
     * ずれるぶんの手当ては page.tsx 側のコメントに書いた。
     */
    welcome: {
      ja: "ようこそ、私のポートフォリオへ。",
      en: "Welcome to my portfolio.",
    },
    /** 全画面への誘い。UI の言葉 (「全画面表示」) は使わず、所作で言う。 */
    closer: { ja: "近づいてみる", en: "Come closer" },
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
