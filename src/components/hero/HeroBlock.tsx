"use client";

import { motion } from "framer-motion";
import { HeroBackground } from "./HeroBackground";
import { HeroLiveCanvas } from "./HeroLiveCanvas";

export function HeroBlock({
  onClick,
  disabled = false,
  ariaLabel,
  mode,
  live = false,
  still = false,
  underlay = null,
  onCapture,
  onRevealed,
  onFailed,
}: {
  onClick?: () => void;
  /** 開ききるまでは押せるものが無いので、フォーカスにも乗せない */
  disabled?: boolean;
  ariaLabel: string;
  mode: "light" | "dark";
  /** ここで WebGL を回すか */
  live?: boolean;
  /** WebGL を使わないと決まったか。焼いてある静止画へ倒す */
  still?: boolean;
  /** 全画面から戻ってきたときの下敷き。展開する直前に撮った 1 枚 */
  underlay?: string | null;
  onCapture?: (capture: () => string | null) => void;
  onRevealed?: () => void;
  onFailed?: () => void;
}) {
  return (
    // 角丸はサイト共通のスケールから独立させ、この 1 箇所で決める。
    <div className="group relative h-full w-full [--hero-radius:0.1875rem]">
      <motion.button
        layoutId="hero-block"
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        // 地色は敷かない。開くまではシャッターがページと同じ色で覆っているので、
        // ここに色があると角の丸みのアンチエイリアスから覗いてしまう
        className={`relative block h-full w-full overflow-hidden rounded-[var(--hero-radius)] outline-accent outline-offset-2 focus-visible:outline-2 ${
          onClick ? "cursor-pointer" : "cursor-default"
        }`}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      >
        {/* ホバーすると窓の中の空だけがゆっくり寄る。クリック後の全画面モーフと
            同じ向きの動きなので、次に何が起きるかの予告になる。枠は動かさない。
            拡大は絵の層それぞれが持つ(進捗のバーと数字は寄らせたくないため)。 */}
        {live && underlay && (
          // 全画面から戻ると Canvas は作り直しになる。その数百ミリ秒を無地で
          // 見せないよう、出ていく直前の 1 枚を敷いておく。
          // データ URL の 1 枚きりで最適化する余地がないので next/image は使わない
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={underlay}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {live && (
          <HeroLiveCanvas
            mode={mode}
            onCapture={onCapture}
            onRevealed={onRevealed}
            onFailed={onFailed}
          />
        )}
        {still && (
          // WebGL が使えないときの受け皿。scale-100 を置いて常に scale を
          // 効かせているのは、中の absolute な画像の基準(包含ブロック)を
          // ホバーの前後でずらさないため。
          <span className="absolute inset-0 scale-100 transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none">
            <HeroBackground priority />
          </span>
        )}
      </motion.button>
    </div>
  );
}
