import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { formatYearMonthDay } from "@/lib/date";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";
import { requireStudioPage } from "@/lib/studio/guard";
import { describeStore, getStore } from "@/lib/studio/store";

/**
 * 記事を書くための画面の入り口。
 *
 * dev では誰でも開ける。本番は studio.riochin.dev を Cloudflare Access で守り、
 * 通っていなければ 404 (lib/studio/guard)。
 *
 * 文言を DICT に足していないのは、ここが公開ページではなく著者ひとりの道具で、
 * 日英に訳す相手が居ないため。
 */

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function StudioIndexPage() {
  await requireStudioPage();

  const { locale } = await getT();
  const store = await getStore();
  const articles = await store.list();

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

      <p className="mt-2 text-sm text-muted-foreground">{describeStore()}</p>

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
