import YAML from "yaml";
import type { YearMonthDay } from "@/lib/date";
import type { Article, ArticleFrontmatter } from "./types";

/**
 * 記事ファイルの読み書き。fs を触らないので、読み取り側 (src/lib/articles/index.ts) と
 * 書き込み側 (src/app/studio/save/route.ts) が同じ 1 組の実装を共有できる。
 * 直列化と解析が別々に育つと、保存はできるのに読めないファイルが静かに生まれる。
 */

/**
 * slug に使える文字。ファイル名と URL の両方になるので小文字英数とハイフンだけに絞り、
 * 先頭・末尾のハイフンと連続ハイフンは許さない。
 *
 * `.` と `/` を含められないので、これを通った時点で content/articles の外は指せない
 * (保存側では解決後の絶対パスも念のため確かめる)。
 */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 64;

/**
 * studio の URL が使う語。/studio/new は「新規作成」の画面なので、
 * 同名の記事があると編集画面から永久に開けなくなる。書く前に弾く。
 */
const RESERVED_SLUGS = new Set(["new"]);

export function isValidSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_SLUG_LENGTH &&
    SLUG.test(value) &&
    !RESERVED_SLUGS.has(value)
  );
}

const YEAR_MONTH_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** 形だけでなく実在する日かも見る。型 (YearMonthDay) は 2 月 31 日を弾けないため。 */
export function isYearMonthDay(value: unknown): value is YearMonthDay {
  if (typeof value !== "string" || !YEAR_MONTH_DAY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** 先頭の frontmatter ブロック。閉じ `---` の後ろの改行までを食べる。 */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/**
 * 記事ファイルを解析する。壊れていたら throw する。
 *
 * 静かに読み飛ばさないのは、記事が自分で書いたコンテンツだから。
 * 1 本が読めなくなったらビルドを落として気付いたほうが、
 * 公開ページから記事が黙って消えるより安全。
 */
export function parseArticleFile(raw: string, slug: string): Article {
  const matched = raw.match(FRONTMATTER);
  if (!matched) {
    throw new Error(`[articles] ${slug}.md: frontmatter が見つかりません`);
  }

  const parsed: unknown = YAML.parse(matched[1]);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`[articles] ${slug}.md: frontmatter が object ではありません`);
  }
  const { title, publishedAt, draft } = parsed as Record<string, unknown>;

  if (typeof title !== "string" || title.trim() === "") {
    throw new Error(`[articles] ${slug}.md: title が空です`);
  }
  if (!isYearMonthDay(publishedAt)) {
    throw new Error(
      `[articles] ${slug}.md: publishedAt が "YYYY-MM-DD" ではありません (${String(publishedAt)})`,
    );
  }
  if (draft !== undefined && typeof draft !== "boolean") {
    throw new Error(`[articles] ${slug}.md: draft が boolean ではありません`);
  }

  return {
    slug,
    title,
    publishedAt,
    ...(draft === undefined ? {} : { draft }),
    markdown: raw.slice(matched[0].length).trim(),
  };
}

/**
 * 記事ファイルを組み立てる。
 *
 * YAML は必ず YAML.stringify に通す。日本語のタイトルには `:` `#` `"` が普通に入り、
 * 手で組み立てると読み込めないファイルを書いてしまう。
 * 文字列を常に二重引用符で囲むのは、publishedAt が YAML の日付リテラルとして
 * 解釈される余地を残さないため (yaml v2 の既定スキーマでは文字列のままだが、
 * ファイルを見た人間にも「これは文字列」と分かるほうがよい)。
 */
export function serializeArticleFile(
  frontmatter: ArticleFrontmatter,
  markdown: string,
): string {
  const yaml = YAML.stringify(
    {
      title: frontmatter.title,
      publishedAt: frontmatter.publishedAt,
      draft: frontmatter.draft ?? false,
    },
    {
      defaultStringType: "QUOTE_DOUBLE",
      defaultKeyType: "PLAIN",
      // 長い日本語タイトルを折り返させない (折ると読みにくく、diff も汚れる)。
      lineWidth: 0,
    },
  );

  return `---\n${yaml}---\n\n${markdown.trim()}\n`;
}
