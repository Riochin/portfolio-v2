import { Fragment } from "react";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { SkillIcon } from "@/components/skills/SkillIcon";
import { TrackGrid } from "@/components/about/TrackGrid";
import { ABOUT } from "@/data/about";
import { SITE } from "@/data/site";
import { getFeaturedSkills } from "@/data";
import { getTopTracks } from "@/lib/spotify";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/about", title: DICT.pages.about });

/*
 * revalidate は「あえて」書いていない。消さないこと。
 *
 * Next 16 のキャッシュは opt-in なので、指定が無いこのページは build 時に
 * 一度だけプリレンダリングされる ([lang] の generateStaticParams が
 * /ja /en を両方生成する)。つまり Spotify の取得も 6 曲の抽選も
 * ビルドの瞬間に 1 回走るだけで、以後はデプロイし直すまで固定される。
 * revalidate を足すとその間隔で曲が入れ替わってしまう。
 *
 * 開発中だけは例外で、next dev はページを常にオンデマンドで描画して
 * キャッシュしないため、リロードのたびに抽選し直される。本番では起きない。
 */

export default async function AboutPage() {
  const { t } = await getT();
  const skills = getFeaturedSkills();
  const tracks = await getTopTracks();

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
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{SITE.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{SITE.handle}</p>
          {/* ラベル列は auto、値列は残り全部。ラベルが伸びても値の頭が揃う。 */}
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm leading-relaxed">
            {ABOUT.facts.map((fact) => (
              <Fragment key={fact.label.en}>
                <dt className="whitespace-nowrap text-muted-foreground">
                  {t(fact.label)}
                </dt>
                <dd>{t(fact.value)}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-10 space-y-4 leading-relaxed">
        {ABOUT.paragraphs.map((paragraph) => (
          <p key={paragraph.en}>{t(paragraph)}</p>
        ))}
      </div>

      {ABOUT.sections.map((section) => (
        <section key={section.label.en} className="mt-16">
          <h2 className="text-lg font-bold">{t(section.label)}</h2>
          {/* 中黒の箇条書きは Experience のハイライトと同じ作りに揃える。 */}
          <ul className="mt-4 space-y-1.5 leading-relaxed">
            {section.items.map((item) => (
              <li key={item.en} className="flex gap-2">
                <span aria-hidden className="text-accent">
                  ·
                </span>
                <span>{t(item)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-16">
        <h2 className="text-lg font-bold">{t(DICT.about.skills)}</h2>
        <ul className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {skills.map((skill) => (
            <li
              key={skill.slug}
              className="flex flex-col items-center gap-2 px-2 py-4"
            >
              <SkillIcon skill={skill} size={36} />
              <span className="text-center text-xs text-muted-foreground">
                {skill.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 技術の話をひと通り置いたあと、最後に人となりの話。
          取得に失敗したときや連携前はセクションごと出さない ──
          空の枠が残る方が「壊れている」ように見えるため。 */}
      {tracks.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-bold">{t(DICT.about.tracks)}</h2>
          <div className="mt-4">
            <TrackGrid tracks={tracks} />
          </div>
        </section>
      )}

      {/* 締めに置く。ここまで読んだ人が次に取る行動なので最後が自然。 */}
      <section className="mt-16">
        <h2 className="text-lg font-bold">{t(ABOUT.contact.label)}</h2>
        <p className="mt-4 leading-relaxed">{t(ABOUT.contact.note)}</p>
        <a
          href={`mailto:${SITE.email}`}
          className="mt-2 inline-block text-muted-foreground underline underline-offset-4 hover:text-accent"
        >
          {SITE.email}
        </a>
      </section>
    </PageShell>
  );
}
