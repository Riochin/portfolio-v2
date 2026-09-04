"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useHeroFraming } from "./framing";
import { HeroBackground } from "./HeroBackground";
import { HeroSceneClient } from "./HeroSceneClient";
import { useIdleVisible } from "./idle";
import { useMorphSettled } from "./morph";
import { HeroNarration } from "./narration/HeroNarration";

// 押したまま動いた距離がこれを越えたら、閉じる合図ではなく見回しとみなす (px)
const TAP_SLOP = 10;
// これだけ操作が途切れたら、右上のボタンを引っ込めて空だけにする (ms)。
// 台本の 0:33 が「右上のボタンで黙ります」と案内する先なので、短すぎると
// 言葉の指す先がもう消えている。
const IDLE_DELAY = 5000;

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
  // ブロックと同じ基準の向きで開く。ここだけ正面に戻すと、モーフの下敷きに
  // 敷いたブロックの 1 枚と、その上に出てくる Canvas とで絵が横へずれる。
  const framing = useHeroFraming();
  const handleReady = useCallback(() => setCanvasReady(true), []);
  // モーフ中に作ると、変形後の小さい bounding rect のまま固定されてしまう。
  // 収まってからマウントして、正しい全画面サイズで初期化させる。
  const [layoutSettled, markLayoutSettled] = useMorphSettled(true);
  // 指で空を見回している間も、離せば click は上がってくる。押した点から
  // 動いたぶんを見て、なぞりだったときは閉じない。
  const origin = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  // 閉じるボタンは操作が途切れたら引っ込む。狙って近づいた先が消えないよう、
  // ポインタが乗っている間とフォーカスが当たっている間は出したままにする
  // (opacity 0 のまま focus が回ると、押せるものの居場所が分からなくなる)。
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // 語りの「静かにする」も右上に並ぶ。出し入れの間合いは 1 つで持ち、
  // 押さえたい事情 (ホバー・フォーカス) だけ両方から集める
  const [narrationHeld, setNarrationHeld] = useState(false);
  const [closeVisible, notifyActivity] = useIdleVisible(
    IDLE_DELAY,
    hovered || focused || narrationHeld,
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      origin.current = { x: event.clientX, y: event.clientY };
      dragged.current = false;
      notifyActivity();
    },
    [notifyActivity],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent) => {
      notifyActivity();
      const start = origin.current;
      if (!start || dragged.current) return;
      if (
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP
      )
        dragged.current = true;
    },
    [notifyActivity],
  );

  // ポインタを動かさない操作の受け口。ルートの pointer 系だけだと、
  // ホイールを回しているだけ・キーだけ触っているときに消えてしまう。
  useEffect(() => {
    window.addEventListener("keydown", notifyActivity);
    window.addEventListener("wheel", notifyActivity, { passive: true });
    return () => {
      window.removeEventListener("keydown", notifyActivity);
      window.removeEventListener("wheel", notifyActivity);
    };
  }, [notifyActivity]);

  const handleClick = useCallback(() => {
    if (dragged.current) return;
    onClose();
  }, [onClose]);

  return (
    <motion.div
      layoutId="hero-block"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onLayoutAnimationComplete={markLayoutSettled}
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
          <HeroSceneClient
            mode={mode}
            yaw={framing.yaw}
            onReady={handleReady}
          />
        </motion.div>
      )}
      {/* 入場の間合いは外側が持つ。内側にも delay を持たせると、引っ込んだ
          あと呼び戻すたびに 0.4 秒待つことになって手応えが鈍る。 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute right-6 top-6 z-20"
      >
        <motion.button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          animate={{ opacity: closeVisible ? 1 : 0 }}
          // 呼べばすぐ出て、引くときはゆっくり。消えるのに気を取られない
          transition={{ duration: closeVisible ? 0.2 : 0.6 }}
          // 見えていない間に hover を拾わせない。この位置を押したぶんは
          // 親へ抜けて、どこを押しても閉じるのと同じ扱いになる。
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 ${
            closeVisible ? "" : "pointer-events-none"
          }`}
        >
          <X size={22} />
        </motion.button>
      </motion.div>
      {/* 語りは全画面のときだけ。トップでは名乗らず、近づいてくれた人の前に
          だけ人格が現れる ── 遠くの灯りに近づくと人がいる、という漁火と
          同じ構造を歓迎の設計にしている。 */}
      <HeroNarration
        mode={mode}
        visible={closeVisible}
        onHoldChange={setNarrationHeld}
      />
    </motion.div>
  );
}
