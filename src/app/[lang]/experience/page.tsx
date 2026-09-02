import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { getExperiencesByYear, getSkills } from "@/data";
import { formatPeriod } from "@/lib/date";
import { DICT } from "@/lib/i18n/dictionary";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = () =>
  buildPageMetadata({ path: "/experience", title: DICT.pages.experience });

/** 1 件ごとの出現ディレイ。Works / Output の一覧と同じ間隔。 */
const STAGGER_MS = 60;

export default async function ExperiencePage() {
  const { locale, t } = await getT();
  const years = getExperiencesByYear();

  // 年をまたいだ通し番号にする。年ごとに 0 へ戻すと、下の年のカードほど
  // 早く出てきてしまい、上から順に現れて見えなくなる。
  const revealOffsets = years.reduce<number[]>(
    (offsets, group, index) => [
      ...offsets,
      index === 0
        ? 0
        : offsets[index - 1] + years[index - 1].experiences.length,
    ],
    [],
  );

  return (
    <PageShell>
      <h1 className="sr-only">{t(DICT.pages.experience)}</h1>

      {/* 年見出しは Output の Talks / Articles と同じ h2 の作りに揃える。
          セクションの間隔も Works ページと同じ mt-16。 */}
      {years.map((group, groupIndex) => (
        <section key={group.year} className={groupIndex === 0 ? "" : "mt-16"}>
          <h2 className="text-lg font-bold">{group.year}</h2>
          {/* 写真はカードの左端まで裁ち落とす。カード側に padding を持たせず、
                本文の p-4 が写真との間隔も兼ねる (写真が無い経験は全周 p-4)。 */}
          {/* 高さは各カードの本文なり。以前は auto-rows-fr で全カードを
              揃えていたが、写真の無いカードまで一番高いカードに引き伸ばされ、
              中身に対して間延びして見えたためやめた。
              写真のあるカードは写真が高さいっぱいに伸びるので余白は出ない。 */}
          <ul className="mt-4 space-y-3">
            {group.experiences.map((exp, index) => (
              <li
                key={exp.slug}
                className={`reveal-rise relative overflow-hidden rounded-xl bg-surface ${
                  exp.image ? "sm:min-h-44" : ""
                }`}
                style={
                  {
                    "--reveal-delay": `${(revealOffsets[groupIndex] + index) * STAGGER_MS}ms`,
                  } as React.CSSProperties
                }
              >
                {/* sm 以上では写真をレイアウトから外す (absolute)。
                    フローに置くと写真の「本来の高さ」(縦長の原寸だと幅 176px で
                    264px) がカードの高さを押し上げ、本文の下に余白ができる。
                    外に出すとカードの高さは本文だけで決まり、写真はその高さに
                    合わせて object-cover で縦を切り取る。min-h-44 は本文が
                    短いときに写真が細くなりすぎないための下限で、逆の上限は
                    9:16 (幅 176px なら 312px)。
                    狭い幅では横並びだと本文が潰れるので、フローのまま上に敷く。 */}
                {exp.image && (
                  <Image
                    src={exp.image.src}
                    alt={t(exp.image.alt)}
                    width={exp.image.width}
                    height={exp.image.height}
                    sizes="(max-width: 640px) 100vw, 176px"
                    className="photo-frame aspect-video w-full object-cover sm:absolute sm:inset-y-0 sm:left-0 sm:aspect-auto sm:h-full sm:max-h-[19.5rem] sm:w-44"
                  />
                )}
                <div className={`min-w-0 p-4 ${exp.image ? "sm:ml-44" : ""}`}>
                  {/* 見出しは所属ではなくプログラム名。
                        「株式会社◯◯」が並ぶより何をやったかで拾い読みできる。 */}
                  <h3 className="font-bold">{t(exp.position)}</h3>
                  {/* 期間は見出しの右ではなく下。同じ行に置くと狭い幅で
                        見出しの折り返しが増えるため。 */}
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(exp.organization)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatPeriod(exp.period, locale)}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed">
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
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {getSkills(exp.stack).map((skill) => (
                        <span
                          key={skill.slug}
                          className="rounded-xl border border-border px-2 py-0.5 text-xs"
                        >
                          {skill.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </PageShell>
  );
}
