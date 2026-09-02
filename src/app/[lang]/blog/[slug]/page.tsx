import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { getArticleBySlug, getArticleSlugs } from "@/lib/articles";
import { formatYearMonthDay } from "@/lib/date";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";

/**
 * 自前記事の詳細。本文の情報源は content/articles/<slug>.md。
 *
 * dynamicParams はあえて固定しない (既定の true のまま)。
 *
 * 当初は false にしていた ── 本文の画像の寸法を public/ の実ファイルから読む
 * のに、public/ は Vercel のサーバー関数バンドルに入らない (CDN が配る) ため。
 * だがこの心配は実際には起きない: 未知の slug は記事が引けず notFound() に
 * 落ちるので画像を読む手前で終わり、既知の slug はビルド時に焼かれている。
 * next.config.ts が public/articles/** も同梱するので、仮に実行時に描いても読める。
 *
 * false のままだと dev で困る。generateStaticParams の結果は再コンパイルまで
 * 据え置かれるので、studio で保存した直後の数秒間、書いたばかりの記事が
 * 404 になる ── 書いてすぐ見に行く動線そのものに当たる。
 * (条件式にはできない。Next は静的な boolean リテラルしか受け付けない)
 */

/** lang はルートレイアウトの generateStaticParams から合成される。 */
export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  // 記事は日本語単言語なので、ja / en に同じ文字列を入れる。
  const title = { ja: article.title, en: article.title };
  const metadata = await buildPageMetadata({
    path: `/blog/${slug}`,
    title,
  });

  // 下書きは URL を知っていれば読めるが、検索には出さない。
  return article.draft ? { ...metadata, robots: { index: false } } : metadata;
}

export default async function ArticlePage({
  params,
}: PageProps<"/[lang]/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const { locale, t } = await getT();

  return (
    <PageShell>
      <article>
        <Link
          href={localePath(locale, "/output")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft size={16} />
          {t(DICT.blog.back)}
        </Link>

        <h1 className="text-2xl font-bold">{article.title}</h1>

        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={article.publishedAt}>
            {formatYearMonthDay(article.publishedAt)}
          </time>
          {article.draft && (
            <span className="rounded-xl border border-border px-3 py-0.5">
              {t(DICT.blog.draft)}
            </span>
          )}
        </p>

        <ArticleBody markdown={article.markdown} />
      </article>
    </PageShell>
  );
}
