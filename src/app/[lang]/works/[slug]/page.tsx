import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { workImageTransitionName } from "@/components/works/WorkGrid";
import {
  getExperienceBySlug,
  getSkills,
  getWorkBySlug,
  getWorkSlugs,
} from "@/data";
import type { WorkLinks } from "@/data/types";
import { formatPeriod, formatYearMonth } from "@/lib/date";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";

/** lang はルートレイアウトの generateStaticParams から合成される。 */
export function generateStaticParams() {
  return getWorkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/works/[slug]">) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);
  if (!work) return {};

  return buildPageMetadata({
    path: `/works/${slug}`,
    title: work.title,
    description: work.tagline,
  });
}

const LINK_ORDER = ["demo", "repo", "article", "slides"] as const satisfies
  readonly (keyof WorkLinks)[];

export default async function WorkDetailPage({
  params,
}: PageProps<"/[lang]/works/[slug]">) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);
  if (!work) notFound();

  const { locale, t } = await getT();
  const related = work.relatedExperience
    ? getExperienceBySlug(work.relatedExperience)
    : undefined;

  return (
    <PageShell>
      <article>
        <Link
          href={localePath(locale, "/works")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft size={16} />
          {t(DICT.works.back)}
        </Link>

        {work.image && (
          // 一覧タイルと同じ name。一覧から来たときは画像がそのまま拡大し、
          // 戻るときは同じモーフが逆再生される。
          <ViewTransition
            name={workImageTransitionName(work.slug)}
            share="morph"
            default="none"
          >
            <div className="photo-frame mb-8 overflow-hidden rounded-xl">
              <Image
                src={work.image.src}
                alt={t(work.image.alt)}
                width={work.image.width}
                height={work.image.height}
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="w-full object-cover"
              />
            </div>
          </ViewTransition>
        )}

        <h1 className="text-2xl font-bold">{t(work.title)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatPeriod(work.period, locale)}
        </p>
        <p className="mt-4 leading-relaxed">{t(work.tagline)}</p>

        <div className="mt-6 space-y-4 leading-relaxed">
          {work.body.map((paragraph) => (
            <p key={paragraph.en}>{t(paragraph)}</p>
          ))}
        </div>

        {work.role && (
          <section className="mt-8">
            <h2 className="text-sm font-bold">{t(DICT.works.role)}</h2>
            <p className="mt-2">{t(work.role)}</p>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-bold">{t(DICT.works.stack)}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {getSkills(work.stack).map((skill) => (
              <span
                key={skill.slug}
                className="rounded-xl border border-border px-3 py-0.5 text-xs"
              >
                {skill.label}
              </span>
            ))}
          </div>
        </section>

        {work.awards && work.awards.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-bold">{t(DICT.works.awards)}</h2>
            <ul className="mt-2 space-y-1.5">
              {work.awards.map((award) => (
                <li
                  key={`${award.date}-${award.prize.en}`}
                  className="flex flex-wrap items-baseline gap-x-3 text-sm"
                >
                  <time dateTime={award.date} className="text-muted-foreground">
                    {formatYearMonth(award.date)}
                  </time>
                  <span className="font-medium">{t(award.prize)}</span>
                  <span className="text-muted-foreground">
                    {t(award.event)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          {LINK_ORDER.map((key) => {
            const href = work.links[key];
            if (!href) return null;
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent transition-opacity hover:opacity-70"
              >
                {t(DICT.works[key])}
                <ExternalLink
                  size={14}
                  className="ml-1 inline-block align-baseline opacity-60"
                />
              </a>
            );
          })}
        </div>

        {related && (
          <section className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm">
            <h2 className="font-bold">{t(DICT.works.related)}</h2>
            <p className="mt-1 text-muted-foreground">
              {t(related.position)} — {t(related.organization)}
            </p>
          </section>
        )}
      </article>
    </PageShell>
  );
}
