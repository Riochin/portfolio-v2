import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { getT } from "@/lib/i18n/server";
import { requireStudioPage } from "@/lib/studio/guard";
import { getStore } from "@/lib/studio/store";

/**
 * 記事の編集画面。
 *
 * generateStaticParams を書かないので、記事が増えてもここは常に要求時に描かれる
 * (認証に headers() を読むので、どのみち静的にはならない)。
 *
 * PageShell を使わないのは、StudioEditor が fixed の面で画面全体を覆うため。
 * ルートレイアウトの SiteChrome はその下に描かれたままになる。
 */

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/** 新規作成の画面。同名の記事は frontmatter.ts の RESERVED_SLUGS が禁じている。 */
const NEW = "new";

/**
 * 今日 (日本時間)。サーバーで決める ── クライアントで new Date() すると
 * hydration がずれるし、Vercel の時計は UTC なので朝のうちは前日になる。
 */
function todayInTokyo(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

/**
 * 新しい記事の slug の既定値は日付。同じ日に 2 本目を書くときは -2, -3 と
 * 足していく。変えたければ編集画面の ⋯ から打ち直せる。
 */
function freeDateSlug(date: string, taken: ReadonlySet<string>): string {
  if (!taken.has(date)) return date;
  for (let n = 2; ; n += 1) {
    const candidate = `${date}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export default async function StudioEditorPage({
  params,
}: PageProps<"/[lang]/studio/[slug]">) {
  await requireStudioPage();

  const { slug } = await params;
  const { locale } = await getT();
  const store = await getStore();

  if (slug === NEW) {
    const articles = await store.list();
    const date = todayInTokyo();
    return (
      <StudioEditor
        doc={{
          slug: freeDateSlug(date, new Set(articles.map((a) => a.slug))),
          title: "",
          publishedAt: date,
          draft: false,
          markdown: "",
        }}
        sha={null}
        existing={false}
        locale={locale}
      />
    );
  }

  const stored = await store.read(slug);
  if (!stored) notFound();

  const { article } = stored;
  return (
    <StudioEditor
      doc={{
        slug: article.slug,
        title: article.title,
        publishedAt: article.publishedAt,
        draft: article.draft ?? false,
        markdown: article.markdown,
      }}
      sha={stored.sha}
      existing
      locale={locale}
    />
  );
}
