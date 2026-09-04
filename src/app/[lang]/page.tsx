import { HeroSection } from "@/components/hero/HeroSection";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DICT } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/paths";

export default async function Home() {
  const { locale, t } = await getT();

  return (
    // ヒーローはちょうど 1 画面。min-h ではなく h で閉じ、はみ出しは作らない
    // (HeroSection 側がブロックを高さ予算で縮めるので、切れるものは無い)。
    //
    // 天地に余白は入れない。ここを空けると中央が「余白の中の中央」になり、
    // ブロックが画面の中央からずれる。固定で載っているもの (モバイルの
    // ヘッダー・下部中央のテーマ切替) と挨拶文・導線のぶんは、HeroSection の
    // --hero-reserve がブロックを縮めて確保する。
    //
    // 例外は short (縦 31rem 未満)。中央に据えると上の余りが遊んだまま下だけ
    // 足りなくなるので、そこだけ余白で居場所を作る従来の作りに戻す。天は
    // モバイルのヘッダー (py-4 + 行 1.875rem)、地は下部中央のテーマ切替
    // (bottom-10 の 2.5rem + h-16 の 4rem) にひと呼吸ぶん。
    <main className="relative flex h-dvh flex-col items-center justify-center overflow-hidden px-6 short:pb-30 max-md:short:pt-[3.875rem]">
      <HeroSection
        aboutHref={localePath(locale, "/about")}
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
          welcomeLight: DICT.hero.welcomeLight.en,
          welcomeDark: DICT.hero.welcomeDark.en,
          closer: t(DICT.hero.closer),
          about: t(DICT.nav.about),
          expand: t(DICT.aria.expandHero),
          close: t(DICT.aria.closeFullscreen),
        }}
      />

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2">
        <ThemeToggle ariaLabel={t(DICT.aria.themeToggle)} />
      </div>
    </main>
  );
}
