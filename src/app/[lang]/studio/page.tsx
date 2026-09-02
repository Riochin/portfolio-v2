import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { getArticles } from "@/lib/articles";
import { formatYearMonthDay } from "@/lib/date";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";

/**
 * 記事を書くための開発専用画面の入り口。/hero-capture と同じく本番では存在しない。
 *
 * 文言を DICT に足していないのは、ここが公開ページではなく著者ひとりの道具で、
 * 日英に訳す相手が居ないため。dev でしか描かれないので翻訳漏れも表に出ない。
 */
export default async function StudioIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await getT();
  const articles = getArticles();

  return (
    <PageShell wide>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Studio</h1>
        <Link
          href={localePath(locale, "/studio/new")}
          className="rounded-xl border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          新しく書く
        </Link>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        書いたものは content/articles/ に .md として残ります。commit して push
        すると公開されます。
      </p>

      {articles.length === 0 ? (
        <p className="mt-8 text-muted-foreground">まだ 1 本もありません。</p>
      ) : (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={localePath(locale, `/studio/${article.slug}`)}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 transition-colors hover:text-accent"
              >
                <span className="font-medium">{article.title}</span>
                {article.draft && (
                  <span className="rounded-xl border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    下書き
                  </span>
                )}
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {article.slug}
                </span>
                <time
                  dateTime={article.publishedAt}
                  className="text-xs text-muted-foreground"
                >
                  {formatYearMonthDay(article.publishedAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
