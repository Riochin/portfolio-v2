import { PageShell } from "@/components/layout/PageShell";
import { OutputGrid } from "@/components/output/OutputGrid";
import { getOutputItems } from "@/lib/output";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/output", title: DICT.pages.output });

export default async function OutputPage() {
  const { t } = await getT();
  const { talks, articles } = await getOutputItems();
  const emptyLabel = t(DICT.output.empty);

  return (
    <PageShell wide>
      <h1 className="sr-only">{t(DICT.pages.output)}</h1>

      <section>
        <h2 className="text-lg font-bold">{t(DICT.output.talks)}</h2>
        <div className="mt-4">
          <OutputGrid items={talks} emptyLabel={emptyLabel} />
        </div>
      </section>
      <section className="mt-16">
        <h2 className="text-lg font-bold">{t(DICT.output.articles)}</h2>
        <div className="mt-4">
          <OutputGrid items={articles} emptyLabel={emptyLabel} />
        </div>
      </section>
    </PageShell>
  );
}
