import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { getArticleBySlug } from "@/lib/articles";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";

/**
 * 記事の編集画面。開発専用。
 *
 * generateStaticParams を書かないので、記事が増えてもここは常に要求時に描かれる。
 * (本番では notFound() になるため、事前生成する意味がない)
 *
 * SiteChrome を隠そうとはしない。あれはルートレイアウトの Server Component が
 * 無条件に描いており、パスを知るには headers() が要る ── そうするとサイト全体が
 * 静的プリレンダリングから外れてしまう。PageShell wide の本文幅
 * (1440px で 700〜780px) はエディタの段幅としてもちょうどよい。
 */

/** 新規作成の画面。同名の記事は frontmatter.ts の RESERVED_SLUGS が禁じている。 */
const NEW = "new";

/** 今日 (サーバー側で決める)。クライアントで new Date() すると hydration がずれる。 */
function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default async function StudioEditorPage({
  params,
}: PageProps<"/[lang]/studio/[slug]">) {
  if (process.env.NODE_ENV === "production") notFound();

  const { slug } = await params;
  const { locale } = await getT();

  const creating = slug === NEW;
  const article = creating ? undefined : getArticleBySlug(slug);
  if (!creating && !article) notFound();

  return (
    <PageShell wide>
      <Link
        href={localePath(locale, "/studio")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft size={16} />
        Studio に戻る
      </Link>

      <StudioEditor
        slug={article?.slug ?? ""}
        title={article?.title ?? ""}
        publishedAt={article?.publishedAt ?? today()}
        draft={article?.draft ?? false}
        markdown={article?.markdown ?? ""}
        existing={article !== undefined}
        locale={locale}
      />

      {article && (
        <p className="mt-6 text-xs text-muted-foreground">
          slug を変えたいときは git mv で名前を変えてください (public/articles/
          の画像も一緒に動かす必要があるため、この画面では変えられません)。
        </p>
      )}
    </PageShell>
  );
}
