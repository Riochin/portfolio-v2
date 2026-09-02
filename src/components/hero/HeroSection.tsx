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
  // 一度でも全画面から戻ったか。戻りのモーフを挟む回だけ、ブロックは
  // Canvas を作るのを待つ
  const [returning, setReturning] = useState(false);
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

  const close = useCallback(() => {
    setReturning(true);
    setIsExpanded(false);
  }, []);
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
      {/* フローに置くのはブロックだけ。挨拶文も下の導線も absolute でブロックに
          吊るす。フローに残すと 3 つの合計が画面の中央に揃ってしまい、ブロック
          自身はそのぶん上へずれる (About への導線を足したときに起きたのがこれ)。

          --hero-reserve はブロック以外がこの画面で使う高さ。ブロックを画面の
          中央に置く以上、上下には必ず同じだけ空くので、厳しい方の 2 倍を取る。

            下 = 7.5rem (テーマ切替: bottom-10 の 2.5rem + h-16 の 4rem に
                         ひと呼吸 1rem) + 3.5rem (導線の行 1.5rem + 間隔 2rem)
               = 11rem
            上 = 3.875rem (モバイルのヘッダー: py-4 + 行 1.875rem)
                 ※ 挨拶文はブロックに重なるので数えない。md 以上はヘッダーも
                   無いので 0

          下が厳しいので 11rem x 2 = 22rem。モバイルと md で同じ値になるため
          1 つで足りる。導線の行の 1.5rem は min-h-6 と対で、文字サイズの
          スケール (globals.css の @theme) を触ったらここも一緒に見直す。

          short (縦 31rem 未満) だけは page 側が余白で居場所を作り、中央では
          なくその余白の中に据える。上下が非対称になるぶん倍を取らずに済み、
          天の余白を pt、地を pb とすると h <= 100dvh - 14.5rem - pt。
          md 以上は pt が 0 なので 14.5rem、モバイルはヘッダーぶん 3.875rem を
          足して 18.5rem (端数は切り上げ)。 */}
      <div className="relative w-full max-w-3xl [--hero-reserve:22rem] max-md:short:[--hero-reserve:18.5rem] md:short:[--hero-reserve:14.5rem]">
        {/* 挨拶文は水平線より下、海の上に重ねる。空には雲が湧くので、字が乗る
            のは面の落ち着いた水側がいい。

            水平線の高さはカメラから出る。画面の中央からの隔たりは
            tan(pitch) / (2 * tan(fov/2)) で、既定 (pitch 0.055 / fov 55) なら
            ブロックの上から 55.3%。字の中心はその下の 61% に置く (top を 22%
            にすると、下辺との中点がちょうど 61%)。字の高さの半分が 3% ほどな
            ので、上辺と水平線の間はまだ空く。ポインタ追従で pitch は ±0.12
            振れ、上を向ききると水平線が 67% まで下がって字を越すが、それは
            見回している間だけの一瞬で、据わりの良さを取った。
            sceneConfig の CAMERA か POINTER_LOOK を触ったらここも計算し直す。

            色はテーマによらず白。下は昼も夜も空の写真なので、
            白い雲に負けないよう暗い影を敷いて拾わせる。
            狭い幅ではブロックも小さいので、字を一回り落として左右に逃げを作り、
            それでも入らなければ折り返させる (中央揃えなので 2 行でも崩れない)。
            pointer-events-none にして、文字の上でもブロックを押せるようにする。 */}
        {!isExpanded && (
          <h1 className="pointer-events-none absolute inset-x-0 bottom-0 top-[22%] z-10 flex items-center justify-center px-4 text-center text-sm font-medium tracking-[0.2em] text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.55),0_0_14px_rgb(0_0_0/0.45)] md:text-base">
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
              returning={returning}
              onCapture={onCapture}
              onRevealed={onRevealed}
              onFailed={onFailed}
            />
          )}
        </div>
        {/* ヒーローは 1 画面で閉じていてスクロールの続きが無いので、「↓」は
            置かない (ブロック自体が押せるので、押すのか送るのかも紛れる)。
            行き先を名乗るリンクにして、空が開ききってから遅れて出す。
            top-full = ブロックの下辺。フローに置かないので、この行が出ても
            ブロックは動かない (中央に据わったまま)。 */}
        {!isExpanded && (
          <div className="absolute inset-x-0 top-full mt-8 flex min-h-6 justify-center">
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
