"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { HeroBlock } from "./HeroBlock";
import { HeroFullscreen } from "./HeroFullscreen";

export type HeroLabels = {
  readonly welcome: string;
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
      <div className="relative w-full max-w-3xl">
        {/* 挨拶文はブロックの中央に重ねる。ただし幅の狭い端末ではブロックが
            小さく、重ねると雲と文字がぶつかるので y 軸方向で上へ逃がす。
            重ねている間はテーマによらず白。下は昼も夜も空の写真なので、
            白い雲に負けないよう暗い影を敷いて拾わせる。ブロックの外に出す
            狭い幅では地の色が明るく白が消えるため、通常の本文色に戻す。
            pointer-events-none にして、文字の上でもブロックを押せるようにする。 */}
        {!isExpanded && (
          <h1 className="pointer-events-none mb-8 text-center text-sm tracking-[0.2em] text-foreground md:absolute md:inset-0 md:z-10 md:mb-0 md:flex md:items-center md:justify-center md:text-base md:font-medium md:text-white md:[text-shadow:0_1px_3px_rgb(0_0_0/0.55),0_0_14px_rgb(0_0_0/0.45)]">
            {/* 1 文字ずつ span に割ると読み上げが文字単位になりうるので、
                支援技術には素の 1 文として渡し、見た目側は隠す。 */}
            <span className="sr-only">{labels.welcome}</span>
            <span aria-hidden>
              {[...labels.welcome].map((char, i) => (
                <span
                  key={i}
                  className="hero-welcome-char"
                  style={{ "--char-delay": `${i * 40}ms` } as CSSProperties}
                >
                  {/* inline-block にすると半角空白が潰れるので実体で置く */}
                  {char === " " ? "\u00a0" : char}
                </span>
              ))}
            </span>
          </h1>
        )}
        <div className="aspect-[16/9] w-full">
          {!isExpanded && (
            <HeroBlock
              onClick={
                prefersReducedMotion ? undefined : () => setIsExpanded(true)
              }
              ariaLabel={labels.expand}
            />
          )}
        </div>
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
