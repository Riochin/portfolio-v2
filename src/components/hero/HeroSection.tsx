"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { HeroBlock } from "./HeroBlock";
import { HeroFullscreen } from "./HeroFullscreen";

export type HeroLabels = {
  readonly expand: string;
  readonly close: string;
};

export function HeroSection({ labels }: { labels: HeroLabels }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  const close = useCallback(() => setIsExpanded(false), []);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded, close]);

  return (
    <LayoutGroup>
      <div className="aspect-[16/9] w-full max-w-3xl">
        {!isExpanded && (
          <HeroBlock
            onClick={
              prefersReducedMotion ? undefined : () => setIsExpanded(true)
            }
            ariaLabel={labels.expand}
          />
        )}
      </div>
      <AnimatePresence>
        {isExpanded && (
          <HeroFullscreen
            mode={mode}
            onClose={close}
            closeLabel={labels.close}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
