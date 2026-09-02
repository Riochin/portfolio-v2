import { HeroSection } from "@/components/hero/HeroSection";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DICT } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const { t } = await getT();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
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
