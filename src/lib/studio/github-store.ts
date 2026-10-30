import "server-only";
import { parseArticleFile } from "@/lib/articles/frontmatter";
import type { Article } from "@/lib/articles/types";
import {
  checkConflict,
  type ArticleStore,
  type Expect,
  type StoredArticle,
} from "./store";

/**
 * 本番用。GitHub の Contents API でリポジトリに直接 commit する。
 *
 * 1 回の保存 = 1 commit。push を受けて Vercel が再デプロイするので、
 * 保存から数分でサイトに出る。画像も 1 枚ずつ commit する (貼るたびに
 * ビルドが走るが、作りが単純で競合も起きない)。
 *
 * 競合は GET で今の sha を取ってから比べる。PUT と GET の間にもう 1 つ commit が
 * 滑り込む隙間はあるが、書き手は 1 人なので実害は無い。
 *
 * トークンは Fine-grained PAT で、このリポジトリの Contents: Read and write だけ。
 * 取り方は .env.example に書いてある。
 */

const API = "https://api.github.com";
const ARTICLES_PATH = "content/articles";
const IMAGES_PATH = "public/articles";
const EXTENSION = ".md";

type ContentEntry = {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir" | "symlink" | "submodule";
};

type FileContent = ContentEntry & {
  encoding: "base64";
  content: string;
};

function env(name: "GITHUB_TOKEN" | "GITHUB_REPO"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} が設定されていません`);
  return value;
}

export class GitHubStore implements ArticleStore {
  readonly #repo = env("GITHUB_REPO");
  readonly #branch = process.env.GITHUB_BRANCH ?? "main";
  readonly #token = env("GITHUB_TOKEN");

  async #request(
    method: "GET" | "PUT",
    path: string,
    init: { accept?: string; body?: unknown; query?: Record<string, string> } = {},
  ): Promise<Response> {
    const url = new URL(`${API}/repos/${this.#repo}/contents/${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      url.searchParams.set(key, value);
    }
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.#token}`,
        Accept: init.accept ?? "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      // Next 16 の fetch は既定で覚えないが、保存の直後に古い一覧を見せる
      // 事故は致命的なので明示しておく。
      cache: "no-store",
    });
  }

  async #failure(response: Response, what: string): Promise<Error> {
    let detail = "";
    try {
      const json = (await response.json()) as { message?: string };
      if (json.message) detail = `: ${json.message}`;
    } catch {
      // 本文が JSON でないときは status だけで十分。
    }
    return new Error(`GitHub で${what}できませんでした (${response.status}${detail})`);
  }

  /** ファイル 1 つを取る。無ければ null。 */
  async #getFile(path: string): Promise<FileContent | null> {
    const response = await this.#request("GET", path, {
      query: { ref: this.#branch },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw await this.#failure(response, "読み出し");
    const json = (await response.json()) as FileContent;
    if (json.type !== "file") return null;
    return json;
  }

  /** 中身をそのまま取る。Contents API の JSON は 1MB までなので画像はこちら。 */
  async #getRaw(path: string): Promise<Uint8Array | null> {
    const response = await this.#request("GET", path, {
      accept: "application/vnd.github.raw+json",
      query: { ref: this.#branch },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw await this.#failure(response, "読み出し");
    return new Uint8Array(await response.arrayBuffer());
  }

  async #put(
    path: string,
    bytes: Uint8Array,
    message: string,
    sha: string | undefined,
  ): Promise<{ sha: string }> {
    const response = await this.#request("PUT", path, {
      body: {
        message,
        content: Buffer.from(bytes).toString("base64"),
        branch: this.#branch,
        ...(sha ? { sha } : {}),
      },
    });
    if (!response.ok) throw await this.#failure(response, "保存");
    const json = (await response.json()) as { content: { sha: string } };
    return { sha: json.content.sha };
  }

  async list(): Promise<readonly Article[]> {
    const response = await this.#request("GET", ARTICLES_PATH, {
      query: { ref: this.#branch },
    });
    if (response.status === 404) return [];
    if (!response.ok) throw await this.#failure(response, "一覧を読み出し");
    const entries = (await response.json()) as ContentEntry[];

    const articles = await Promise.all(
      entries
        .filter((entry) => entry.type === "file" && entry.name.endsWith(EXTENSION))
        .map(async (entry) => {
          const bytes = await this.#getRaw(entry.path);
          if (bytes === null) throw new Error(`${entry.path} が読めません`);
          return parseArticleFile(
            Buffer.from(bytes).toString("utf8"),
            entry.name.slice(0, -EXTENSION.length),
          );
        }),
    );
    return articles.sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        a.slug.localeCompare(b.slug),
    );
  }

  async read(slug: string): Promise<StoredArticle | null> {
    const file = await this.#getFile(`${ARTICLES_PATH}/${slug}${EXTENSION}`);
    if (file === null) return null;
    const raw = Buffer.from(file.content, "base64").toString("utf8");
    return { article: parseArticleFile(raw, slug), sha: file.sha };
  }

  async write(
    slug: string,
    file: string,
    expect: Expect,
    message: string,
  ): Promise<{ sha: string }> {
    const path = `${ARTICLES_PATH}/${slug}${EXTENSION}`;
    const current = await this.#getFile(path);
    checkConflict(expect, current?.sha ?? null);
    return this.#put(path, Buffer.from(file, "utf8"), message, current?.sha);
  }

  async readImage(slug: string, name: string): Promise<Uint8Array | null> {
    return this.#getRaw(`${IMAGES_PATH}/${slug}/${name}`);
  }

  async writeImage(
    slug: string,
    name: string,
    bytes: Uint8Array,
    message: string,
  ): Promise<{ created: boolean }> {
    const path = `${IMAGES_PATH}/${slug}/${name}`;
    if ((await this.#getFile(path)) !== null) return { created: false };
    await this.#put(path, bytes, message, undefined);
    return { created: true };
  }
}
