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
          色は薄めずベタのまま、円を拡大することで表現する。
          clip-path のアニメーションは毎フレーム再ペイントが走ってカクつくため、
          GPU で合成される transform(scale) を使う。
          円の一辺は角に届くよう対角より大きく取り、枠の形で切り抜く。
          キーボード操作でも同じ反応にするため focus-within も見る。 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 overflow-hidden rounded-[1.25rem]"
      >
        <span className="absolute left-1/2 top-1/2 aspect-square w-[125%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-accent transition-transform duration-500 ease-out group-hover:scale-100 group-focus-within:scale-100 motion-reduce:transition-none" />
      </span>
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
