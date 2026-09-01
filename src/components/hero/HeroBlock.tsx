"use client";

import { motion } from "framer-motion";
import { HeroBackground } from "./HeroBackground";

export function HeroBlock({ onClick }: { onClick?: () => void }) {
  return (
    <motion.button
      layoutId="hero-block"
      type="button"
      onClick={onClick}
      aria-label="空の演出を全画面で表示"
      className={`relative block h-full w-full overflow-hidden rounded-2xl ${
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
        Riochin
      </motion.span>
    </motion.button>
  );
}
