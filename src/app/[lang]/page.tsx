import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { HeroSection } from "@/components/hero/HeroSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { OutputTile } from "@/components/output/OutputTile";
import { WorkTile } from "@/components/works/WorkTile";
import { toWorkGridItem } from "@/components/works/toWorkGridItem";
import { getHomeWorks } from "@/data";
import { ABOUT } from "@/data/about";
import { SITE } from "@/data/site";
import { formatYearMonth } from "@/lib/date";
import { DICT } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/paths";
import { getRecentOutputs } from "@/lib/output";
import { ARTICLES_ANCHOR } from "@/lib/output/config";
import { formatPublishedAt } from "@/lib/output/format";
import type { OutputItem } from "@/lib/output/types";

/**
 * トップの文字だけのリスト (Experience / Recent articles) の日付列とリンク。
 * 2 つで同じものを使い、見た目を揃える。
 *
 * 日付列は日までの幅 ("2026.10.15") で固定する。月までの Experience も
 * 同じ幅にしておくと、セクションをまたいでも本文の頭が揃う。
 * リンクは下線で示す ── Experience はリンクのある行と無い行が混ざるので、
 * 下線があればリンク、という 1 つの決まりにしておく。
 */
const LIST_DATE_CLASS = "w-20 shrink-0 tabular-nums text-muted-foreground";
const LIST_LINK_CLASS =
  "underline decoration-muted-foreground/50 underline-offset-4 transition-opacity hover:opacity-70";

/**
 * トップに出す登壇・記事の件数。記事はタイトルだけで人柄が伝わる最小限。
 * 登壇はサムネイルのタイルで Featured works と同じ並び (xl で 1 段、
 * それ未満は 2 列 x 2 段) にするので、穴があかない 4 件。
 */
const RECENT_COUNTS = { talks: 4, articles: 3 };

export default async function Home() {
  const { locale, t } = await getT();
  const works = getHomeWorks().map((work) => toWorkGridItem(work, locale, t));
  const { talks, articles } = await getRecentOutputs(locale, RECENT_COUNTS);

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

        {/* 海の下は「誰が」「どう来たか」「何を作ったか」「何を話し、書いたか」の順。
            トップは各ページの縮小版を並べる目次ではないので、どれも写真と
            タイトルか 1 行の文字に絞り、詳しくは各ページへ渡す。
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

          {/* 道のり。トップしか見ない人にも「どう来た人か」が伝わるよう、
              節目だけを年月と 1 行で並べる。縦線や丸は打たない ── 部品が
              増えるぶん読む手間が増え、見慣れたタイムラインの型にも寄る。
              続きが読める行だけ下線を引いてリンクにする (外部の記事には
              外部リンクの印も付ける)。日付列とリンクの見た目は
              LIST_DATE_CLASS / LIST_LINK_CLASS で下のリストと共通。 */}
          <section className="mt-16">
            <h2 className="text-lg font-bold">{t(DICT.pages.experience)}</h2>
            <ol className="mt-6 space-y-2 text-sm">
              {ABOUT.journey.map((step) => {
                const external =
                  step.href !== undefined && !step.href.startsWith("/");
                return (
                  <li key={step.text.en} className="flex gap-4">
                    <time dateTime={step.date} className={LIST_DATE_CLASS}>
                      {formatYearMonth(step.date)}
                    </time>
                    {step.href ? (
                      <Link
                        href={
                          external ? step.href : localePath(locale, step.href)
                        }
                        {...(external && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                        className={LIST_LINK_CLASS}
                      >
                        {t(step.text)}
                        {external && (
                          <ExternalLink
                            size={13}
                            className="ml-1 inline align-[-0.125em] opacity-60"
                          />
                        )}
                      </Link>
                    ) : (
                      <span>{t(step.text)}</span>
                    )}
                  </li>
                );
              })}
            </ol>
            <Link
              href={localePath(locale, "/experience")}
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-70"
            >
              {t(DICT.home.allExperience)}
              <ArrowRight size={16} />
            </Link>
          </section>

          <section className="mt-16">
            <h2 className="text-lg font-bold">{t(DICT.home.featured)}</h2>
            {/* 4 件を xl で 1 段、それ未満は 2 列 x 2 段。トップは要約なので
                タイルは写真とタイトルだけにして縦幅を抑える (compact)。
                3 列にはしない (4 件だと最終行に 1 件だけ残る)。 */}
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 xl:grid-cols-4">
              {works.map((work) => (
                <li key={work.slug} className="group">
                  <WorkTile work={work} compact />
                </li>
              ))}
            </ul>
            <Link
              href={localePath(locale, "/works")}
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-70"
            >
              {t(DICT.home.allWorks)}
              <ArrowRight size={16} />
            </Link>
          </section>

          {/* 最近の登壇と記事。登壇はサムネイルのタイル、記事は文字だけの
              リスト (理由は RecentOutputSection)。並びは /output と同じく
              登壇が先。フィードが落ちて 0 件ならセクションごと出さない。 */}
          <RecentOutputSection
            title={t(DICT.home.recentTalks)}
            items={talks}
            tiles
            moreHref={localePath(locale, "/output")}
            moreLabel={t(DICT.home.allTalks)}
          />
          <RecentOutputSection
            title={t(DICT.home.recentArticles)}
            items={articles}
            moreHref={`${localePath(locale, "/output")}#${ARTICLES_ANCHOR}`}
            moreLabel={t(DICT.home.allArticles)}
          />
        </div>
      </main>
      {/* フッターはモバイルだけ (PageShell と同じ)。 */}
      <SiteFooter />
    </>
  );
}

/**
 * トップの Recent talks / Recent articles。
 *
 * articles は日付とタイトルだけの 1 行ずつ。talks は tiles で、スライドの
 * 表紙を敷いたタイルにする ── 表紙は 1 枚ずつ見た目が違い、人前で話す
 * 様子も伝わるので、画像にする意味がある。記事の OGP は Zenn の型で
 * どれも似るので、並べても情報が増えず縦に伸びるだけ。
 */
function RecentOutputSection({
  title,
  items,
  moreHref,
  moreLabel,
  tiles = false,
}: {
  title: string;
  items: readonly OutputItem[];
  moreHref: string;
  moreLabel: string;
  tiles?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-lg font-bold">{title}</h2>
      {tiles ? (
        // 並びと大きさは Featured works (compact) に揃える。
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.url} className="group">
              <OutputTile item={item} compact />
            </li>
          ))}
        </ul>
      ) : (
        <ol className="mt-6 space-y-2 text-sm">
          {items.map((item) => {
            // 自前記事だけ遷移先がサイト内。別タブに飛ばさず、外部リンクの印も出さない。
            const internal = item.source === "self";
            return (
              <li key={item.url} className="flex gap-4">
                <time dateTime={item.publishedAt} className={LIST_DATE_CLASS}>
                  {formatPublishedAt(item.publishedAt)}
                </time>
                <Link
                  href={item.url}
                  {...(!internal && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                  className={LIST_LINK_CLASS}
                >
                  {item.title}
                  {!internal && (
                    <ExternalLink
                      size={13}
                      className="ml-1 inline align-[-0.125em] opacity-60"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      <Link
        href={moreHref}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-70"
      >
        {moreLabel}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
