"use client";

import { motion } from "framer-motion";
import { HeroBackground } from "./HeroBackground";
import { HeroLiveCanvas } from "./HeroLiveCanvas";
import { useMorphSettled } from "./morph";

export function HeroBlock({
  onClick,
  disabled = false,
  ariaLabel,
  mode,
  live = false,
  still = false,
  underlay = null,
  returning = false,
  inviting = false,
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
  /** 全画面から戻ってきた回か。モーフが収まるまで Canvas を作らない */
  returning?: boolean;
  /** 全画面への誘いが出ている最中か。空をほんの少しだけ寄せる */
  inviting?: boolean;
  onCapture?: (capture: () => string | null) => void;
  onRevealed?: () => void;
  onFailed?: () => void;
}) {
  // 縮んでいく途中で Canvas を作ると、全画面ぶんに引き伸ばされた bounding
  // rect を測って、その大きさのまま固定されてしまう (絵だけが拡大され、
  // 水平線も定位置から外れる)。収まるまでは下敷きの 1 枚で見せておく。
  const [settled, markSettled] = useMorphSettled(returning);

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
        onLayoutAnimationComplete={markSettled}
      >
        {/* 窓の中の空だけがゆっくり寄る。クリック後の全画面モーフと同じ向きの
            動きなので、次に何が起きるかの予告になる。枠は動かさない
            (枠まで動くと、窓ではなくカードが浮いたように見える)。

            寄る合図は 2 つある。
              ・ホバー ── 拡大は絵の層それぞれが持つ (進捗のバーと数字は
                寄らせたくないので、外には掛けない)
              ・「近づいてみる」が滞在で出たとき ── ホバーの無い端末にも
                同じ予告を届けたいが、絵の層には手が届かないので、この層で
                まとめて寄せる。ホバー中は scale-100 に戻して、絵の層が持つ
                寄りと二重に掛からないようにする

            常に scale を持たせてあるのは、中の absolute な層の基準 (包含ブロック)
            を寄りの前後でずらさないため。読み込みの進捗もこの中に入るが、誘いが
            出るのは空が開ききってからなので、進捗が寄せられて見えることはない。

            Tailwind v4 の scale-* は transform ではなく独立プロパティの scale を
            出すが、transition-transform はその scale も含むのでこれで効く
            (HeroLiveCanvas が素の transition なのは、transition-[...] で
            property を手書きすると scale が漏れるという別の話)。 */}
        <span
          className={`absolute inset-0 transition-transform duration-700 ease-out motion-reduce:transition-none ${
            inviting ? "scale-[1.015] group-hover:scale-100" : "scale-100"
          }`}
        >
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
          {live && settled && (
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
        </span>
      </motion.button>
    </div>
  );
}
