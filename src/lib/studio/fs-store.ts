import "server-only";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { ARTICLES_DIR } from "@/lib/articles";
import { parseArticleFile } from "@/lib/articles/frontmatter";
import type { Article } from "@/lib/articles/types";
import { gitBlobSha } from "./blob-sha";
import {
  checkConflict,
  type ArticleStore,
  type Expect,
  type StoredArticle,
} from "./store";

/**
 * dev 用。リポジトリの作業ツリーに直接書く。
 *
 * 書き込み先はいつも通り content/articles/ と public/articles/ なので、
 * 著者が git diff で確かめてから commit する流れは今まで通り。
 * sha は git と同じ blob SHA を計算して返す (github-store と約束を揃えるため)。
 */

const EXTENSION = ".md";
const PUBLIC_ARTICLES_DIR = join(process.cwd(), "public", "articles");

/** slug / name は呼び出し側で検証済みだが、結合した結果も必ず確かめる。 */
function inside(base: string, ...parts: string[]): string {
  const path = normalize(join(base, ...parts));
  if (!path.startsWith(base + sep)) throw new Error("不正な保存先です");
  return path;
}

async function readIfExists(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export class FsStore implements ArticleStore {
  async list(): Promise<readonly Article[]> {
    let entries: string[];
    try {
      entries = await readdir(ARTICLES_DIR);
    } catch {
      return [];
    }
    const articles = await Promise.all(
      entries
        .filter((name) => name.endsWith(EXTENSION))
        .map(async (name) => {
          const raw = await readFile(join(ARTICLES_DIR, name), "utf8");
          return parseArticleFile(raw, name.slice(0, -EXTENSION.length));
        }),
    );
    return articles.sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        a.slug.localeCompare(b.slug),
    );
  }

  async read(slug: string): Promise<StoredArticle | null> {
    const bytes = await readIfExists(inside(ARTICLES_DIR, `${slug}${EXTENSION}`));
    if (bytes === null) return null;
    return {
      article: parseArticleFile(bytes.toString("utf8"), slug),
      sha: gitBlobSha(bytes),
    };
  }

  async write(slug: string, file: string, expect: Expect): Promise<{ sha: string }> {
    const path = inside(ARTICLES_DIR, `${slug}${EXTENSION}`);
    const current = await readIfExists(path);
    checkConflict(expect, current === null ? null : gitBlobSha(current));

    const bytes = Buffer.from(file, "utf8");
    await mkdir(ARTICLES_DIR, { recursive: true });
    await writeFile(path, bytes);
    return { sha: gitBlobSha(bytes) };
  }

  async readImage(slug: string, name: string): Promise<Uint8Array | null> {
    return readIfExists(inside(PUBLIC_ARTICLES_DIR, slug, name));
  }

  async writeImage(
    slug: string,
    name: string,
    bytes: Uint8Array,
  ): Promise<{ created: boolean }> {
    const dir = inside(PUBLIC_ARTICLES_DIR, slug);
    const path = inside(dir, name);
    if (existsSync(path)) return { created: false };
    await mkdir(dir, { recursive: true });
    await writeFile(path, bytes);
    return { created: true };
  }
}
