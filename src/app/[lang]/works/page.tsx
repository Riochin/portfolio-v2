import { PageShell } from "@/components/layout/PageShell";
import { AwardList, type AwardListItem } from "@/components/works/AwardList";
import { WorkGrid } from "@/components/works/WorkGrid";
import { toWorkGridItem } from "@/components/works/toWorkGridItem";
import { getAwards, getWorksByCategory } from "@/data";
import { formatYearMonth } from "@/lib/date";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/works", title: DICT.pages.works });

export default async function WorksPage() {
  const { locale, t } = await getT();
  const awards = getAwards().map((award): AwardListItem => ({
    key: `${award.work.slug}-${award.date}-${t(award.prize)}`,
    date: formatYearMonth(award.date),
    dateTime: award.date,
    prize: t(award.prize),
    event: t(award.event),
    workTitle: t(award.work.title),
    workHref: localePath(locale, `/works/${award.work.slug}`),
  }));

  // ロケールをここで解決してから Client Component に渡す。
  // (アクセサ層はロケール非依存なので、この境界が唯一の解決点になる)
  const groups = getWorksByCategory().map((group) => ({
    category: group.category,
    heading: t(DICT.workCategories[group.category]),
    items: group.works.map((work) => toWorkGridItem(work, locale, t)),
  }));

  return (
    <PageShell wide>
      <h1 className="sr-only">{t(DICT.pages.works)}</h1>

      {groups.map((group, index) => (
        <section key={group.category} className={index === 0 ? "" : "mt-16"}>
          <h2 className="text-lg font-bold">{group.heading}</h2>
          <div className="mt-6">
            {/* ファーストビューに入るのは最初のセクションの 1 行目だけ。
                最大 3 列なので 3 件を先読みし、以降は既定どおり遅延に任せる。 */}
            <WorkGrid
              sectionKey={group.category}
              items={group.items}
              moreLabel={t(DICT.common.showMore)}
              lessLabel={t(DICT.common.showLess)}
              priorityCount={index === 0 ? 3 : 0}
            />
          </div>
        </section>
      ))}

      <section className="mt-20">
        <h2 className="text-lg font-bold">{t(DICT.works.awards)}</h2>
        <AwardList items={awards} />
      </section>
    </PageShell>
  );
}
