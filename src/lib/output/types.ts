export type OutputSource = "speakerdeck" | "zenn" | "qiita";

export type OutputItem = {
  source: OutputSource;
  title: string;
  url: string;
  publishedAt: string;
  /**
   * 一覧タイルに敷くサムネイル。
   * フィードが持っていればそれを、無ければ記事ページの og:image を使う。
   * どちらも取れないことがあるので optional。
   */
  thumbnail?: string;
};
