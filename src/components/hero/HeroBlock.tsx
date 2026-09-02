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
      {/* ホバーするとアクセントがブロックの中心から広がって外へ染み出す。
          色は薄めずベタのまま、円形のクリップを広げることで表現する。
          (半径 71% で角に届くので、余裕を見て 75%)
          キーボード操作でも同じ反応にするため focus-within も見る。 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-[1.25rem] bg-accent [clip-path:circle(0%_at_50%_50%)] transition-[clip-path] duration-500 ease-out group-hover:[clip-path:circle(75%_at_50%_50%)] group-focus-within:[clip-path:circle(75%_at_50%_50%)] motion-reduce:transition-none"
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
