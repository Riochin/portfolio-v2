import { HeroSection } from "@/components/hero/HeroSection";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="fixed right-[10%] top-1/2 hidden -translate-y-1/2 md:block">
        <SocialLinks />
      </div>

      <HeroSection />

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2">
        <ThemeToggle />
      </div>
    </main>
  );
}
