import "server-only";
import type { Article } from "@/lib/articles/types";

/**
 * studio の保存層。記事 (.md) と本文中の画像を読み書きする。
 *
 * 実装は 2 つ:
 * - fs-store: dev。リポジトリの作業ツリーに直接書き、著者が git diff で確かめて commit する
 * - github-store: 本番。Vercel のファイルシステムは読み取り専用なので、
 *   GitHub の Contents API で main に commit する。push で Vercel が再デプロイする
 *
 * `sha` は git の blob SHA。開いたときの値を保存時に送り返してもらい、
 * その間に別の端末や手元の git から同じファイルが変わっていたら上書きしない。
 */

export type StoredArticle = {
  readonly article: Article;
  readonly sha: string;
};

/**
 * 保存の前提。
 * - `{ sha: null }`: 新規。既にあれば失敗
 * - `{ sha }`: 更新。今の sha が違えば失敗
 * - `"force"`: 確かめずに書く (上書きを確認した後に使う)
 */
export type Expect = { readonly sha: string | null } | "force";

export type ConflictCode = "exists" | "changed" | "missing";

export class StoreConflictError extends Error {
  constructor(
    readonly code: ConflictCode,
    /** 今その場所にあるファイルの sha。無ければ null。 */
    readonly current: string | null,
  ) {
    super(
      code === "exists"
        ? "同じ slug の記事が既にあります"
        : code === "changed"
          ? "開いてから別の場所で書き換えられています"
          : "開いてから記事が消されています",
    );
    this.name = "StoreConflictError";
  }
}

export interface ArticleStore {
  /** 下書きも含む全記事 (公開日の新しい順)。 */
  list(): Promise<readonly Article[]>;
  read(slug: string): Promise<StoredArticle | null>;
  /** `file` は frontmatter 込みの .md 全文。返すのは書いた後の sha。 */
  write(
    slug: string,
    file: string,
    expect: Expect,
    message: string,
  ): Promise<{ sha: string }>;
  readImage(slug: string, name: string): Promise<Uint8Array | null>;
  /**
   * 同じ名前の画像が既にあれば何もしない (名前に中身のハッシュが入っているので
   * 同じ名前なら同じ画像)。commit を増やさないため。
   */
  writeImage(
    slug: string,
    name: string,
    bytes: Uint8Array,
    message: string,
  ): Promise<{ created: boolean }>;
}

/** 本番の保存先 (GitHub) の設定が揃っているか。 */
export function hasGitHubStore(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

export async function getStore(): Promise<ArticleStore> {
  if (hasGitHubStore()) {
    const { GitHubStore } = await import("./github-store");
    return new GitHubStore();
  }
  const { FsStore } = await import("./fs-store");
  return new FsStore();
}

/** 現在の保存先の説明。studio の一覧に出す。 */
export function describeStore(): string {
  return hasGitHubStore()
    ? `GitHub の ${process.env.GITHUB_REPO} (${process.env.GITHUB_BRANCH ?? "main"}) に commit されます。push 後、数分でサイトに出ます。`
    : "content/articles/ に .md として残ります。commit して push すると公開されます。";
}

export function checkConflict(expect: Expect, current: string | null): void {
  if (expect === "force") return;
  if (expect.sha === null) {
    if (current !== null) throw new StoreConflictError("exists", current);
    return;
  }
  if (current === null) throw new StoreConflictError("missing", null);
  if (current !== expect.sha) throw new StoreConflictError("changed", current);
}
