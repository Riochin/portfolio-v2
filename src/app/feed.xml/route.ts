import { getPublishedArticles } from "@/lib/articles";
import { buildRss } from "@/lib/rss";

/**
 * /feed.xml。中身の組み立ては lib/rss に置き、ここは記事を渡すだけ。
 *
 * llms.txt と同じく force-static にしてビルド時に書き出す。記事は
 * content/articles/*.md を実行時に読む作りなので、実行時に組むと
 * outputFileTracingIncludes が要る。記事が増えるのはデプロイのときだけなので、
 * ビルド時に固めれば足りる。下書きは sitemap と同じく載せない。
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(buildRss(getPublishedArticles()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
