"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { syncThemeColor } from "@/lib/themeColor";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  );
}

/** 選ばれているテーマを <meta name="theme-color"> に映す (lib/themeColor.ts)。
    トグルを押したときは ThemeToggle が先回りして書くので、ここが拾うのは
    読み込み時 (前回トグルで選んだテーマの復元) と端末の明暗の切り替え。 */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      syncThemeColor(resolvedTheme);
    }
  }, [resolvedTheme]);
  return null;
}
