import { HeroSection } from "@/components/hero/HeroSection";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DICT } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const { t } = await getT();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      {/* Alex Brush は上下に大きく張り出すので leading を素の 1 より広く取り、
          p / y のディセンダが Hero ブロックに触れないようにしている。 */}
      <h1 className="hero-welcome-in mb-8 text-center font-logo text-4xl leading-[1.3] text-foreground sm:text-5xl md:text-6xl">
        {t(DICT.hero.welcome)}
      </h1>

      <HeroSection
        labels={{
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
