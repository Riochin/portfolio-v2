import type { YearMonthDay } from "@/lib/date";

/**
 * 記事の frontmatter。
 *
 * title が Localized<string> ではなく素の string なのが、このサイトで唯一の例外。
 * 作品や経歴は 1 行〜数段落なので日英を揃えられるが、記事は書き下ろしの長文で、
 * 訳す負荷が執筆そのものを止めてしまう。記事だけ日本語単言語にすると決めた
 * (design.md)。/output に並ぶ Zenn / Qiita の記事も日本語なので不揃いにならない。
 */
export type ArticleFrontmatter = {
  readonly title: string;
  readonly publishedAt: YearMonthDay;
  /** 省略時は公開。true の間は一覧と sitemap から外れ、noindex で本人だけが読める。 */
  readonly draft?: boolean;
};

/** frontmatter + ファイル名から来る slug + 本文。Work と同じく slug は持ち物ではなく所在から来る。 */
export type Article = ArticleFrontmatter & {
  readonly slug: string;
  /** frontmatter を除いた Markdown 本文。 */
  readonly markdown: string;
};
