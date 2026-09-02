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
    // 上下の余白は固定で載っているものの居場所。天はモバイルのヘッダー
    // (py-4 + 行 1.875rem = 3.875rem)、地は下部中央のテーマ切替 (bottom-10 の
    // 2.5rem + 4rem) にひと呼吸ぶん。ここを空けておかないと、中身は画面全体の
    // 中央に揃うので、低い画面では導線がボタンの下敷きになる。
    <main className="relative flex h-dvh flex-col items-center justify-center overflow-hidden px-6 pt-[3.875rem] pb-30 md:pt-0">
      <HeroSection
        aboutHref={localePath(locale, "/about")}
        labels={{
          welcome: t(DICT.hero.welcome),
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
