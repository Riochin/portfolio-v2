import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/hero/HeroSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WorkTile } from "@/components/works/WorkTile";
import { toWorkGridItem } from "@/components/works/toWorkGridItem";
import { getHomeWorks } from "@/data";
import { ABOUT } from "@/data/about";
import { SITE } from "@/data/site";
import { DICT } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/paths";

export default async function Home() {
  const { locale, t } = await getT();
  const works = getHomeWorks().map((work) => toWorkGridItem(work, locale, t));

  return (
    <>
      <main className="w-full flex-1">
        {/* ヒーローはちょうど 1 画面。プロフィールと作品はその下に続く。
            min-h ではなく h で閉じる (HeroSection 側がブロックを高さ予算で
            縮めるので、切れるものは無い)。

            天地に余白は入れない。ここを空けると中央が「余白の中の中央」になり、
            ブロックが画面の中央からずれる。固定で載っているもの (モバイルの
            ヘッダー) と下部中央のテーマ切替、挨拶文のぶんは、HeroSection の
            --hero-reserve がブロックを縮めて確保する。

            例外は short (縦 31rem 未満)。中央に据えると上の余りが遊んだまま
            下だけ足りなくなるので、余白で居場所を作る。天は
            モバイルのヘッダー (py-4 + 行 1.875rem)、地は下部中央のテーマ切替
            (bottom-10 の 2.5rem + h-16 の 4rem) にひと呼吸ぶん。

            テーマ切替はこのセクションに置き、スクロールすると一緒に流れる。画面に固定すると
            下のプロフィールや作品に重なる。下端から少し浮かせる (モバイル 4rem、
            md 3rem)。short は余地が無いので下端寄り (2.5rem) のまま。

            高さは dvh ではなく svh。dvh だとスマホのブラウザのツールバーが
            出入りするたびにセクションが伸び縮みし、下端に吊るしたテーマ切替と
            スクロールの合図、中央のブロックまで上下に揺れる。svh はツールバーが
            出ている側の高さで固定なので、隠れたときは下が少し覗くだけで済む。
            ただし LINE などのアプリ内ブラウザでは svh まで動くので、
            HeroSection が最初の 100svh を px で測って --hero-h に止める
            (useFrozenViewportHeight)。測る前は 100svh で描く。
            HeroSection の高さ予算も同じ --hero-h を使う。 */}
        <section className="relative flex h-[var(--hero-h,100svh)] flex-col items-center justify-center overflow-hidden px-6 short:pb-30 max-md:short:pt-[3.875rem]">
        <HeroSection
          labels={{
            // 挨拶文だけは日本語ロケールでも en を出すので、t() を通さない。
            // ここは意味を運ぶ前に絵の一部で、仮名と漢字は字面の濃さがまちまちな
            // ぶん水平線の上で「文章」として立ってしまうが、ラテン字なら字の高さが
            // 揃って白い帯のまま馴染む。日本語で来た人がこの海の出自を母語で
            // 読めないのは損だが、全画面に入れば Riochin が日本語で語り直す
            // (narration の reveal) ので、トップは絵に徹してよい。
            //
            // t() を外したぶん、文書の lang (ja) と中身がずれる。日本語の音で
            // 英文を読み上げられないよう、HeroSection の h1 に lang="en" を
            // 立ててある ── ここを t() に戻すときは、あちらも対で外すこと。
            welcome: DICT.hero.welcome.en,
            closer: t(DICT.hero.closer),
            expand: t(DICT.aria.expandHero),
            close: t(DICT.aria.closeFullscreen),
          }}
        />

          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 md:bottom-12 short:bottom-10">
            <ThemeToggle ariaLabel={t(DICT.aria.themeToggle)} />
          </div>
        </section>

        {/* 海の下は「誰が」「何を」の順。トップは各ページの縮小版を並べる
            目次ではないので、人と作品の 2 つに絞る (経歴や記事はナビから)。
            左右は PageShell と同じく、固定ナビと SNS アイコンのぶんを空ける。 */}
        <div className="px-6 pb-16 pt-12 md:pl-[28%] md:pr-[18%] md:pt-16">
          <section className="max-w-3xl">
            <div className="flex items-center gap-5">
              <Image
                src={ABOUT.photo.src}
                alt={t(ABOUT.photo.alt)}
                width={ABOUT.photo.width}
                height={ABOUT.photo.height}
                sizes="80px"
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
              <div>
                <h2 className="text-lg font-bold">{SITE.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t(DICT.home.role)}
                </p>
              </div>
            </div>
            <p className="mt-5 leading-relaxed">{t(ABOUT.summary)}</p>
            <Link
              href={localePath(locale, "/about")}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-70"
            >
              {t(DICT.home.more)}
              <ArrowRight size={16} />
            </Link>
          </section>

          <section className="mt-16">
            <h2 className="text-lg font-bold">{t(DICT.home.featured)}</h2>
            {/* 4 件を 2 列 x 2 段。Works の一覧と違い 3 列にしない
                (4 件だと最終行に 1 件だけ残る)。 */}
            <ul className="mt-6 grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2">
              {works.map((work) => (
                <li key={work.slug} className="group">
                  <WorkTile work={work} />
                </li>
              ))}
            </ul>
            <Link
              href={localePath(locale, "/works")}
              className="mt-8 inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-70"
            >
              {t(DICT.home.allWorks)}
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </main>
      {/* フッターはモバイルだけ (PageShell と同じ)。 */}
      <SiteFooter />
    </>
  );
}
