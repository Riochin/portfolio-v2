"use client";

import { motion } from "framer-motion";
import { HeroBackground } from "./HeroBackground";
import { SITE } from "@/data/site";

export function HeroBlock({
  onClick,
  ariaLabel,
}: {
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="group relative h-full w-full">
      {/* ホバーするとアクセントがブロックの外へ染み出す。ぼかしや
          フェードは使わず、ベタ塗りの面を背面に置いて即座に出す。
          キーボード操作でも同じ反応にするため focus-within も見る。 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 hidden rounded-[1.5rem] bg-accent group-hover:block group-focus-within:block"
      />
      <motion.button
        layoutId="hero-block"
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`relative block h-full w-full overflow-hidden rounded-2xl outline-none ${
          onClick ? "cursor-pointer" : "cursor-default"
        }`}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      >
        <HeroBackground priority />
        {/* 全画面から戻ってきたときにフェードインで復帰する(opacity は CSS 側) */}
        <motion.span
          layoutId="hero-logo"
          className="hero-logo-in relative z-10 flex h-full items-center justify-center font-logo text-7xl text-[#1c1c1c] md:text-8xl dark:text-white"
        >
          {SITE.brand}
        </motion.span>
      </motion.button>
    </div>
  );
}
