import { PageShell } from "@/components/layout/PageShell";
import { getExperiences, getSkills } from "@/data";
import { formatPeriod } from "@/lib/date";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/experience", title: DICT.pages.experience });

export default async function ExperiencePage() {
  const { locale, t } = await getT();
  const experiences = getExperiences();

  return (
    <PageShell>
      <ul className="space-y-8">
        {experiences.map((exp) => (
          <li
            key={exp.slug}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-bold">{t(exp.organization)}</h2>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatPeriod(exp.period, locale)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(exp.position)}
            </p>
            <ul className="mt-3 space-y-1.5 leading-relaxed">
              {exp.highlights.map((highlight) => (
                <li key={highlight.en} className="flex gap-2">
                  <span aria-hidden className="text-accent">
                    ·
                  </span>
                  <span>{t(highlight)}</span>
                </li>
              ))}
            </ul>
            {exp.stack && (
              <div className="mt-4 flex flex-wrap gap-2">
                {getSkills(exp.stack).map((skill) => (
                  <span
                    key={skill.slug}
                    className="rounded-xl border border-border px-3 py-0.5 text-xs"
                  >
                    {skill.label}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
