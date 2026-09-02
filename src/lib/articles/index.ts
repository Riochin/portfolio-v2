import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArticleFile } from "./frontmatter";
import type { Article } from "./types";

/**
 * 記事の読み取り層。src/data/index.ts と同じ約束を守る:
 * **全て同期・ロケール非依存**。
 *
 * opengraph-image.tsx は Route Handler 扱いで next/root-params を使えないため、
 * ここが非同期だったりロケールを知っていたりすると OG 画像から呼べなくなる。
 *
 * 記事だけは情報源が TS モジュールではなく content/articles/*.md にある。
 * dev 専用の studio (/studio) が書き、著者が commit してデプロイする。
 * .md はバンドラのグラフに載らないので、Vercel に載せるには next.config.ts の
 * outputFileTracingIncludes が要る (/output は ISR で実行時にもここを読む)。
 */

export const ARTICLES_DIR = join(process.cwd(), "content", "articles");

const EXTENSION = ".md";

function readAll(): readonly Article[] {
  let entries: string[];
  try {
    entries = readdirSync(ARTICLES_DIR);
  } catch {
    // まだ 1 本も書いていない (ディレクトリが無い) のは異常ではない。
    return [];
  }

  return entries
    .filter((name) => name.endsWith(EXTENSION))
    .map((name) => {
      const slug = name.slice(0, -EXTENSION.length);
      const raw = readFileSync(join(ARTICLES_DIR, name), "utf8");
      return parseArticleFile(raw, slug);
    })
    .sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        // 同じ日に複数出したときの並びを安定させる。
        a.slug.localeCompare(b.slug),
    );
}

/**
 * 覚えるのは本番だけ。
 *
 * dev で覚えると、.md は誰も import しないためモジュールが再評価されず、
 * studio で保存しても /studio と /output が古い一覧のまま張り付く。
 * 本番はビルド時 (と ISR の再生成時) に読むだけなので覚えて構わない。
 */
let cached: readonly Article[] | undefined;

function all(): readonly Article[] {
  if (process.env.NODE_ENV !== "production") return readAll();
  cached ??= readAll();
  return cached;
}

/** 下書きも含む全記事 (公開日の新しい順)。studio の一覧が使う。 */
export function getArticles(): readonly Article[] {
  return all();
}

/** 公開済みのみ。/output の一覧と sitemap が使う。 */
export function getPublishedArticles(): readonly Article[] {
  return all().filter((article) => article.draft !== true);
}

/** 下書きも含む。generateStaticParams が使う (下書きも本人は読めるべきなので)。 */
export function getArticleSlugs(): string[] {
  return all().map((article) => article.slug);
}

/** sitemap 用。下書きは載せない。 */
export function getPublishedArticleSlugs(): string[] {
  return getPublishedArticles().map((article) => article.slug);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return all().find((article) => article.slug === slug);
}
