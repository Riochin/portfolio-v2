"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { HeroSceneClient } from "./HeroSceneClient";

export function HeroFullscreen({
  mode,
  still = false,
  snapshot = null,
  onClose,
  closeLabel,
}: {
  mode: "light" | "dark";
  /** WebGL を使わないと決まったか。焼いてある静止画へ倒す */
  still?: boolean;
  /** 展開する瞬間にブロックが描いていた 1 枚 */
  snapshot?: string | null;
  onClose: () => void;
  closeLabel: string;
}) {
  const [canvasReady, setCanvasReady] = useState(false);
  const handleReady = useCallback(() => setCanvasReady(true), []);
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
      className="fixed inset-0 z-50 overflow-hidden bg-surface"
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
    >
      {/* モーフの下敷き。ブロックが最後に描いていた 1 枚をそのまま伸ばすので、
          拡大の前後で絵が飛ばない。別に焼いた静止画を挟むと、波や雲の位相が
          違うぶんだけ入れ替わりが目に付く。 */}
      {still ? (
        <HeroBackground />
      ) : (
        snapshot && (
          // データ URL の 1 枚きりで最適化する余地がないので next/image は使わない
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snapshot}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      )}
      {!still && layoutSettled && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: canvasReady ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* ブロック側で先に読み込んであれば、チャンクは取得済み */}
          <HeroSceneClient mode={mode} onReady={handleReady} />
        </motion.div>
      )}
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
