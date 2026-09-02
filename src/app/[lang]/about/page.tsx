import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { SkillIcon } from "@/components/skills/SkillIcon";
import { ABOUT } from "@/data/about";
import { getFeaturedSkills } from "@/data";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/about", title: DICT.pages.about });

export default async function AboutPage() {
  const { t } = await getT();
  const skills = getFeaturedSkills();

  return (
    <PageShell>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <Image
          src={ABOUT.photo.src}
          alt={t(ABOUT.photo.alt)}
          width={ABOUT.photo.width}
          height={ABOUT.photo.height}
          priority
          sizes="(max-width: 640px) 160px, 200px"
          className="photo-frame h-40 w-40 shrink-0 rounded-full object-cover"
        />
        <div className="space-y-4 leading-relaxed">
          {ABOUT.paragraphs.map((paragraph) => (
            <p key={paragraph.en}>{t(paragraph)}</p>
          ))}
        </div>
      </div>

      <section className="mt-16">
        <h2 className="text-lg font-bold">{t(DICT.about.skills)}</h2>
        <ul className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {skills.map((skill) => (
            <li
              key={skill.slug}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-2 py-4"
            >
              <SkillIcon skill={skill} size={24} />
              <span className="text-center text-xs text-muted-foreground">
                {skill.label}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
