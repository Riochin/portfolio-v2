"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroBlock } from "./HeroBlock";
import { HeroFullscreen } from "./HeroFullscreen";
import { useWebGLSupported } from "./webgl";

export type HeroLabels = {
  readonly welcome: string;
  readonly about: string;
  readonly expand: string;
  readonly close: string;
};

export function HeroSection({
  labels,
  aboutHref,
}: {
  labels: HeroLabels;
  /** ヒーローから次に見せたい 1 ページ。ロケール付きのパスで受け取る。 */
  aboutHref: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  // 展開する瞬間にブロックが描いていた 1 枚。モーフの下敷きに使う
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const captureRef = useRef<(() => string | null) | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const supportsWebGL = useWebGLSupported();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  // 静止画へ倒すのは WebGL が無いか、動きを減らす設定のときだけ。どちらも
  // まだ分からない間(サーバと水和の 1 回目)は無地で、どちらにも倒さない。
  const still =
    supportsWebGL === false || prefersReducedMotion === true || failed;
  // resolvedTheme が決まる前に始めると、暗いテーマでも一度昼の空を
  // 組み立ててから夜へ切り替わってしまう。
  const live = supportsWebGL === true && !still && Boolean(resolvedTheme);
  // 読み込みの間、ブロックは出さず中央の線だけが見えている。挨拶文もその線と
  // 重ねず、空が開ききってから出す(1 文字ずつの出現もそこで見せたい)。
  const shown = still || revealed;

  const close = useCallback(() => setIsExpanded(false), []);
  const onRevealed = useCallback(() => setRevealed(true), []);
  const onFailed = useCallback(() => setFailed(true), []);
  const onCapture = useCallback((capture: () => string | null) => {
    captureRef.current = capture;
  }, []);

  const expand = useCallback(() => {
    // まだ絵が出ていない間の Canvas は組み立ての途中で、撮っても意味のある
    // 絵にならない。その場合は下敷きなしで無地から展開する。
    setSnapshot(revealed ? (captureRef.current?.() ?? null) : null);
    setIsExpanded(true);
  }, [revealed]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded, close]);

  return (
    <LayoutGroup>
      {/* --hero-reserve はブロック以外がこの画面で使う高さ。page 側が空けた
          上下の余白 (モバイル 3.875rem + 7.5rem / md 以上は 7.5rem のみ) に、
          挨拶文と下の導線の行 (各 1.25rem + 2rem の間隔) を足したもの。
          md 以上では挨拶文がブロックに重なるので、その行は数えない。 */}
      <div className="relative w-full max-w-3xl [--hero-reserve:18rem] md:[--hero-reserve:13rem]">
        {/* 挨拶文はブロックの中央に重ねる。ただし幅の狭い端末ではブロックが
            小さく、重ねると雲と文字がぶつかるので y 軸方向で上へ逃がす。
            重ねている間はテーマによらず白。下は昼も夜も空の写真なので、
            白い雲に負けないよう暗い影を敷いて拾わせる。ブロックの外に出す
            狭い幅では地の色が明るく白が消えるため、通常の本文色に戻す。
            pointer-events-none にして、文字の上でもブロックを押せるようにする。 */}
        {!isExpanded && (
          <h1 className="pointer-events-none mb-8 min-h-5 text-center text-sm tracking-[0.2em] text-foreground md:absolute md:inset-0 md:z-10 md:mb-0 md:flex md:items-center md:justify-center md:text-base md:font-medium md:text-white md:[text-shadow:0_1px_3px_rgb(0_0_0/0.55),0_0_14px_rgb(0_0_0/0.45)]">
            {/* 1 文字ずつ span に割ると読み上げが文字単位になりうるので、
                支援技術には素の 1 文として渡し、見た目側は隠す。 */}
            <span className="sr-only">{labels.welcome}</span>
            <span aria-hidden>
              {shown &&
                [...labels.welcome].map((char, i) => (
                  <span
                    key={i}
                    className="hero-welcome-char"
                    style={{ "--char-delay": `${i * 40}ms` } as CSSProperties}
                  >
                    {/* inline-block にすると半角空白が潰れるので実体で置く */}
                    {char === " " ? "\u00a0" : char}
                  </span>
                ))}
            </span>
          </h1>
        )}
        {/* 16/9 は幅からしか高さを決めないので、低い画面 (横向きの端末など) では
            ブロックだけで画面を越えてしまう。残り高さから逆算した幅で頭を押さえ、
            比を保ったまま縮ませる。max() は予算が尽きたときに幅が 0 や負に
            なって消えないための下限。 */}
        <div className="mx-auto aspect-[16/9] w-full max-w-[calc(max(9rem,100dvh-var(--hero-reserve))*16/9)]">
          {!isExpanded && (
            <HeroBlock
              onClick={prefersReducedMotion || !shown ? undefined : expand}
              disabled={!shown}
              ariaLabel={labels.expand}
              mode={mode}
              live={live}
              still={still}
              underlay={snapshot}
              onCapture={onCapture}
              onRevealed={onRevealed}
              onFailed={onFailed}
            />
          )}
        </div>
        {/* ヒーローは 1 画面で閉じていてスクロールの続きが無いので、「↓」は
            置かない (ブロック自体が押せるので、押すのか送るのかも紛れる)。
            行き先を名乗るリンクにして、空が開ききってから遅れて出す。
            器は先に置いて高さを取っておき、出現でブロックが動かないようにする。 */}
        {!isExpanded && (
          <div className="mt-8 flex min-h-5 justify-center">
            {shown && (
              <Link
                href={aboutHref}
                className="reveal-rise inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
                // 挨拶文が 1 文字ずつ出そろうのを待ってから
                style={{ "--reveal-delay": "1000ms" } as CSSProperties}
              >
                {labels.about}
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        )}
      </div>
      <AnimatePresence>
        {isExpanded && (
          <HeroFullscreen
            mode={mode}
            still={still}
            snapshot={snapshot}
            onClose={close}
            closeLabel={labels.close}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
