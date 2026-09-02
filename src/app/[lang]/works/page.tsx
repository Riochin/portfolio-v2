import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { WorkGrid, type WorkGridItem } from "@/components/works/WorkGrid";
import { getAwards, getSkills, getWorks } from "@/data";
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
  const awards = getAwards();

  // ロケールをここで解決してから Client Component に渡す。
  // (アクセサ層はロケール非依存なので、この境界が唯一の解決点になる)
  const items: WorkGridItem[] = getWorks().map((work) => ({
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
  }));

  return (
    <PageShell wide>
      <section>
        <h2 className="sr-only">{t(DICT.pages.works)}</h2>
        <WorkGrid items={items} />
      </section>

      <section className="mt-20">
        <h2 className="text-lg font-bold">{t(DICT.works.awards)}</h2>
        <ul className="mt-4 space-y-2">
          {awards.map((award) => (
            <li
              key={`${award.work.slug}-${award.date}-${t(award.prize)}`}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border py-2 text-sm"
            >
              <time
                dateTime={award.date}
                className="w-20 shrink-0 text-muted-foreground"
              >
                {formatYearMonth(award.date)}
              </time>
              <span className="font-medium">{t(award.prize)}</span>
              <span className="text-muted-foreground">{t(award.event)}</span>
              <Link
                href={localePath(locale, `/works/${award.work.slug}`)}
                className="ml-auto text-accent transition-opacity hover:opacity-70"
              >
                {t(award.work.title)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
