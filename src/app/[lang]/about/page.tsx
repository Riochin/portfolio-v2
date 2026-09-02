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

/** 1 ブロックごとの出現ディレイ。Works / Output / Experience の一覧と同じ間隔。 */
const STAGGER_MS = 60;

/**
 * 上から数えたブロック番号を出現ディレイに直す。
 *
 * 他ページは一覧の 1 件ずつをずらしているが、このページの中身は一覧ではなく
 * 読みものなので、「写真 → 本文 → 各セクション」という大きな塊の単位で
 * 上から順に出す。段落や箇条書きまで 1 行ずつずらすと、読み始めるまで
 * 待たされる時間が長くなるため。
 */
const revealDelay = (index: number) =>
  ({ "--reveal-delay": `${index * STAGGER_MS}ms` }) as React.CSSProperties;

/** ABOUT.sections の通し番号の起点。写真ブロックと本文が先に来る。 */
const SECTIONS_INDEX = 2;

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

  // 以降は可変長 (sections の件数、Spotify の有無) なので番号を積み上げる。
  // tracks が無いときは連絡先が 1 つ繰り上がり、途中の番号が飛ばない。
  const skillsIndex = SECTIONS_INDEX + ABOUT.sections.length;
  const tracksIndex = skillsIndex + 1;
  const contactIndex = tracksIndex + (tracks.length > 0 ? 1 : 0);

  return (
    <PageShell>
      {/* 写真・名前・ハンドルは縦に積んで中央揃え。
          幅が広くても横並びにしないのは、横にすると写真も名前も
          ページの中央から外れてしまうため。 */}
      <div
        className="reveal-rise flex flex-col items-center text-center"
        style={revealDelay(0)}
      >
        <Image
          src={ABOUT.photo.src}
          alt={t(ABOUT.photo.alt)}
          width={ABOUT.photo.width}
          height={ABOUT.photo.height}
          priority
          sizes="160px"
          className="photo-frame h-40 w-40 rounded-full object-cover"
        />
        <h1 className="mt-6 text-2xl font-bold">{SITE.name}</h1>
        {/* 下線は連絡先のメールリンクと同じ作り。名前のすぐ下で色しか変わらないと
            リンクだと気づけないので、常時下線を引いておく。 */}
        <a
          href={SITE.handleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-accent"
        >
          {SITE.handle}
        </a>
        {/* ラベル列は auto、値列は残り全部。ラベルが伸びても値の頭が揃う。
            中央に置くのは表全体 (w-fit + mx-auto 相当の items-center) で、
            中身は text-left のまま。ラベルと値をそれぞれ中央揃えにすると
            2 行の頭が揃わなくなる。max-w-full は EN の長い所属名ではみ出さず
            折り返させるため。 */}
        <dl className="mt-6 grid w-fit max-w-full grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-left text-sm leading-relaxed">
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

      {/* 本文だけ左右を少し内側に入れる。見出しや一覧と同じ幅で始まるより、
          ひとこと分だけ引っ込んでいる方が「私からのコメント」として読める。 */}
      <div
        className="reveal-rise mt-10 space-y-4 px-4 leading-relaxed"
        style={revealDelay(1)}
      >
        {ABOUT.paragraphs.map((paragraph) => (
          <p key={paragraph.en}>{t(paragraph)}</p>
        ))}
      </div>

      {ABOUT.sections.map((section, index) => (
        <section
          key={section.label.en}
          className="reveal-rise mt-16"
          style={revealDelay(SECTIONS_INDEX + index)}
        >
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

      <section className="reveal-rise mt-16" style={revealDelay(skillsIndex)}>
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
        <section
          className="reveal-rise mt-16"
          style={revealDelay(tracksIndex)}
        >
          <h2 className="text-lg font-bold">{t(DICT.about.tracks)}</h2>
          <div className="mt-4">
            {/* ジャケットは 1 枚ずつずれて出る。その 1 枚目をセクション自身と
                同時に出したいので、ここまでの通し番号を起点として渡す。 */}
            <TrackGrid
              tracks={tracks}
              startDelayMs={tracksIndex * STAGGER_MS}
            />
          </div>
        </section>
      )}

      {/* 締めに置く。ここまで読んだ人が次に取る行動なので最後が自然。 */}
      <section className="reveal-rise mt-16" style={revealDelay(contactIndex)}>
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
