import { PageShell } from "@/components/layout/PageShell";
import { AwardList, type AwardListItem } from "@/components/works/AwardList";
import { WorkGrid, type WorkGridItem } from "@/components/works/WorkGrid";
import { getAwards, getSkills, getWorksByCategory } from "@/data";
import { formatPeriod, formatYearMonth } from "@/lib/date";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/works", title: DICT.pages.works });

/** 一覧のタイルに出す技術チップの上限。 */
const STACK_PREVIEW = 3;

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
    items: group.works.map((work): WorkGridItem => ({
      slug: work.slug,
      href: localePath(locale, `/works/${work.slug}`),
      title: t(work.title),
      period: formatPeriod(work.period, locale),
      image: work.image && {
        src: work.image.src,
        width: work.image.width,
        height: work.image.height,
        alt: t(work.image.alt),
      },
      stack: getSkills(work.stack.slice(0, STACK_PREVIEW)).map((s) => s.label),
    })),
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
