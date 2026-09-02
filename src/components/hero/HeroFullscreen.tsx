"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { HeroCanvasWrapper } from "./HeroCanvasWrapper";
import { SITE } from "@/data/site";

export function HeroFullscreen({
  mode,
  onClose,
  closeLabel,
}: {
  mode: "light" | "dark";
  onClose: () => void;
  closeLabel: string;
}) {
  const [canvasReady, setCanvasReady] = useState(false);
  // レイアウトアニメーション中は要素に transform がかかっており、R3F が
  // 変形後の小さい bounding rect を測ってそのサイズで固定してしまう。
  // モーフ完了後にマウントすることで正しい全画面サイズで初期化させる。
  const [layoutSettled, setLayoutSettled] = useState(false);

  useEffect(() => {
    // onLayoutAnimationComplete が発火しないケースへの保険
    const timer = setTimeout(() => setLayoutSettled(true), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      layoutId="hero-block"
      onClick={onClose}
      onLayoutAnimationComplete={() => setLayoutSettled(true)}
      className="fixed inset-0 z-50 overflow-hidden"
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
    >
      <HeroBackground />
      {layoutSettled && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: canvasReady ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          <HeroCanvasWrapper mode={mode} onReady={() => setCanvasReady(true)} />
        </motion.div>
      )}
      {/* 全画面では WebGL を遮らないようロゴをフェードアウト(opacity は CSS 側) */}
      <motion.span
        layoutId="hero-logo"
        className="hero-logo-out pointer-events-none absolute inset-0 z-10 flex items-center justify-center font-logo text-7xl text-[#1c1c1c] md:text-8xl dark:text-white"
      >
        {SITE.brand}
      </motion.span>
      <motion.button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute right-6 top-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
      >
        <X size={22} />
      </motion.button>
    </motion.div>
  );
}
