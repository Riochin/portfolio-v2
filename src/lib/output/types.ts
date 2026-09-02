/**
 * アウトプットの出どころ。"self" だけが外部サービスではなく
 * このサイト自身 (content/articles/*.md) を指す。
 *
 * 一覧はソースを問わず /output の「書いた記事」に混ぜるが、self は遷移先が
 * サイト内なので OutputGrid が別タブではなくクライアント遷移で開く。
 */
export type OutputSource = "speakerdeck" | "zenn" | "qiita" | "self";

export type OutputItem = {
  source: OutputSource;
  title: string;
  /** 外部記事は絶対 URL、self はロケール付きのサイト内パス ("/ja/blog/foo")。 */
  url: string;
  publishedAt: string;
  /**
   * 一覧タイルに敷くサムネイル。
   * フィードが持っていればそれを、無ければ記事ページの og:image を使う。
   * どちらも取れないことがあるので optional。
   */
  thumbnail?: string;
};
