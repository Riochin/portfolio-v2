import { getExperiencesByYear, getFeaturedSkills, getWorks } from "@/data";
import { getPublishedArticles } from "@/lib/articles";
import { buildLlmsTxt } from "@/lib/llms-txt";

/**
 * /llms.txt。中身の組み立ては lib/llms-txt に置き、ここはデータを渡すだけ。
 *
 * force-static にしてビルド時に書き出す。記事は content/articles/*.md を
 * 実行時に読む作りなので、実行時に組むと outputFileTracingIncludes が要る
 * (/output と同じ罠)。記事が増えるのはデプロイのときだけなので、
 * ビルド時に固めれば足りる。
 */
export const dynamic = "force-static";

export function GET() {
  const body = buildLlmsTxt({
    works: getWorks(),
    experiences: getExperiencesByYear().flatMap((group) => group.experiences),
    articles: getPublishedArticles(),
    skills: getFeaturedSkills(),
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
