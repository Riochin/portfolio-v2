import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { DICT } from "@/lib/i18n/dictionary";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";

/** 1 ブロックごとの出現ディレイ。About と同じ間隔。 */
const STAGGER_MS = 60;

const revealDelay = (index: number) =>
  ({ "--reveal-delay": `${index * STAGGER_MS}ms` }) as React.CSSProperties;

/**
 * 見つからなかったときの画面。
 *
 * ルートレイアウトが [lang] の中にあるので、この 1 枚だけでは
 * 「どのルートにも一致しない URL」までは拾えない。Next の /_not-found は
 * app ディレクトリの根の not-found.tsx からしか組まれず、根には layout.tsx が
 * 無いためだ (根に置くと Next が root layout を自動生成してしまい、html/body・
 * フォント・globals.css・ThemeProvider・SiteChrome を二重に持つことになる)。
 * そこを埋めているのが隣の [...rest]/page.tsx で、存在しない URL をいちど
 * [lang] の中で一致させてから notFound() を投げ、この境界に落としている。
 *
 * not-found.tsx は props を取れない (Next の docs: Reference / Props) ので、
 * 「/ja/typo は見つかりません」のように探していたパスは出せない。
 * generateMetadata も持てないが、404 を返すページには Next が noindex を
 * 自動で入れるので、こちらで足すものは無い。
 */
export default async function NotFound() {
  const { locale, t } = await getT();

  return (
    <PageShell>
      <div className="reveal-rise" style={revealDelay(0)}>
        {/* 「404」は出さない。番号を知っている人には要らないし、知らない人には
            意味が無い。何が起きたかは下の一文が全部言っている。 */}
        <h1 className="text-2xl font-bold">{t(DICT.notFound.title)}</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {t(DICT.notFound.message)}
        </p>
      </div>

      {/* 押せる面は「もっとみる」(WorkGrid / OutputGrid) から借りる。
          サイト内で既に押される面として通っている形なので、新しい語彙を
          増やさない。DetailPager の PAGER_BACK_LINK は詳細ページの
          幅いっぱいのページャ用なので、ここでは使わない。 */}
      <div className="reveal-rise mt-10" style={revealDelay(1)}>
        <Link
          href={localePath(locale, "/")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          <ArrowLeft size={16} className="shrink-0" />
          {t(DICT.notFound.home)}
        </Link>
      </div>
    </PageShell>
  );
}
