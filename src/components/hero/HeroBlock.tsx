"use client";

import { motion } from "framer-motion";
import { HeroBackground } from "./HeroBackground";

export function HeroBlock({
  onClick,
  ariaLabel,
}: {
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    // 角丸はサイト共通のスケールから独立させ、この 1 箇所で決める。
    <div className="group relative h-full w-full [--hero-radius:0.1875rem]">
      <motion.button
        layoutId="hero-block"
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`relative block h-full w-full overflow-hidden rounded-[var(--hero-radius)] outline-accent outline-offset-2 focus-visible:outline-2 ${
          onClick ? "cursor-pointer" : "cursor-default"
        }`}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      >
        {/* ホバーすると窓の中の空だけがゆっくり寄る。クリック後の全画面モーフと
            同じ向きの動きなので、次に何が起きるかの予告になる。枠は動かさない。
            scale-100 を置いて常に scale を効かせているのは、この span を中の
            absolute な画像の基準(包含ブロック)にし、ホバーの前後で基準が
            ずれないようにするため。 */}
        <span className="block h-full w-full scale-100 transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none">
          <HeroBackground priority />
        </span>
      </motion.button>
    </div>
  );
}
