import { PageShell } from "@/components/layout/PageShell";
import { OutputGrid } from "@/components/output/OutputGrid";
import { getOutputItems } from "@/lib/output";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/output", title: DICT.pages.output });

export default async function OutputPage() {
  const { locale, t } = await getT();
  // locale を渡すのは自前記事のリンク先 (/ja/blog/...) を組み立てるため。
  const { talks, articles } = await getOutputItems(locale);
  // Talks と Articles で同じものを渡すので、ロケール解決は 1 回だけにする。
  const gridLabels = {
    emptyLabel: t(DICT.output.empty),
    moreLabel: t(DICT.common.showMore),
    lessLabel: t(DICT.common.showLess),
  };

  return (
    <PageShell wide>
      <h1 className="sr-only">{t(DICT.pages.output)}</h1>

      <section>
        <h2 className="text-lg font-bold">{t(DICT.output.talks)}</h2>
        <div className="mt-4">
          {/* ファーストビューに入るのは Talks の 1 行目だけ。最大 3 列なので
              3 件を先読みする。Articles は画面外なので遅延のままでよい。 */}
          <OutputGrid items={talks} {...gridLabels} priorityCount={3} />
        </div>
      </section>
      <section className="mt-16">
        <h2 className="text-lg font-bold">{t(DICT.output.articles)}</h2>
        <div className="mt-4">
          <OutputGrid items={articles} {...gridLabels} />
        </div>
      </section>
    </PageShell>
  );
}
