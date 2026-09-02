"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { HeroSceneClient, useHeroSceneLoaded } from "./HeroSceneClient";
import { HeroLoadingProgress, OPEN_DURATION } from "./HeroLoadingProgress";
import { QUALITY } from "./sceneConfig";

// 進捗の各段の上限。実測で次の段へ入るまで、数字はここへ漸近する。
const CEILING = {
  /** three/drei のチャンク待ち */
  module: 0.5,
  /** 素材(テクスチャ)待ち。読み込み割合のぶんだけ module から伸ばす */
  assets: 0.8,
  /** 素材は揃った。ここから初回フレームまではシェーダのコンパイル待ち */
  compile: 0.97,
} as const;

const COMPACT_QUERY = "(max-width: 768px)";

// ここまでに 1 枚も描けなければ諦めて静止画へ倒す。開かないままだと、
// ヒーローが線 1 本のまま終わってしまうため。
const FALLBACK_DELAY = 20000;

// 一度でも絵を出したか。全画面から戻るとブロックは組み立て直しになるが、
// そこで 0→100% をもう一度見せられても仕方がないので、2 回目からは黙って出す。
let shownOnce = false;

function subscribeCompact(onChange: () => void) {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// 狭い幅では一段軽い設定にする。回しはするが電池を使いすぎないように。
function useBlockQuality() {
  const compact = useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );

  return compact ? QUALITY.blockCompact : QUALITY.block;
}

/**
 * ヒーローブロックの中で回り続ける Canvas。視点操作は付けない(全画面のときだけ)。
 *
 * 準備できるまでは無地のまま、下端のバーと数字で進み具合だけを出す。静止画を
 * 敷いて待たせないのは、本番の絵と少しでも違うと入れ替わった瞬間に飛ぶため。
 */
export function HeroLiveCanvas({
  mode,
  onCapture,
  onRevealed,
  onFailed,
}: {
  mode: "light" | "dark";
  /** 今描かれている絵を静止画として取り出す手段を親へ渡す */
  onCapture?: (capture: () => string | null) => void;
  /** 絵が出た合図 */
  onRevealed?: () => void;
  /** 待っても描けなかった合図 */
  onFailed?: () => void;
}) {
  const loaded = useHeroSceneLoaded();
  const [assetProgress, setAssetProgress] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [finished, setFinished] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [withProgress] = useState(() => !shownOnce);
  const containerRef = useRef<HTMLDivElement>(null);
  const quality = useBlockQuality();

  // 進捗を出す回はシャッターが開き始めてから、出さない回は描けた時点で見せる
  const revealed = withProgress ? finished : ready;

  useEffect(() => {
    if (!revealed) return;
    shownOnce = true;
    // 開ききってから知らせる。挨拶文が開いている途中の線と重なるのを避ける
    if (!withProgress) {
      onRevealed?.();
      return;
    }
    const timer = setTimeout(() => onRevealed?.(), OPEN_DURATION);
    return () => clearTimeout(timer);
  }, [revealed, withProgress, onRevealed]);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => onFailed?.(), FALLBACK_DELAY);
    return () => clearTimeout(timer);
  }, [ready, onFailed]);

  // 見えていないあいだは描かない。ただし初回フレームは onReady の合図を
  // 兼ねているので、そこへ辿り着くまでは止めない。
  useEffect(() => {
    if (!ready) return;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      // 画面の際で切り替わってちらつかないよう、少し手前から回し始める
      { rootMargin: "200px" },
    );
    observer.observe(node);

    const syncPageVisible = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", syncPageVisible);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPageVisible);
    };
  }, [ready]);

  const handleAssetProgress = useCallback(
    (value: number) => setAssetProgress(value),
    [],
  );
  const handleAssetsReady = useCallback(() => setAssetsReady(true), []);
  const handleReady = useCallback(() => setReady(true), []);
  const handleFinished = useCallback(() => setFinished(true), []);

  const ceiling = ready
    ? 1
    : assetsReady
      ? CEILING.compile
      : loaded
        ? CEILING.module + (CEILING.assets - CEILING.module) * assetProgress
        : CEILING.module;

  return (
    <>
      {/* ホバーで空だけがゆっくり寄る。線と数字は寄らせたくないので、
          拡大はこの層に持たせて外には掛けない。
          進捗を出す回はシャッターが覆っているので、透明度は触らずに置いておく。
          戻ってきた回は下敷き(直前の 1 枚)の上へ重ねてフェードで入れ替える。 */}
      <div
        ref={containerRef}
        aria-hidden
        // transition-[...] で property を列挙すると、Tailwind v4 が scale を
        // 独立プロパティで出すぶんホバーの寄りが効かなくなる。素の transition に任せる
        className={`absolute inset-0 scale-100 transition duration-700 ease-out group-hover:scale-[1.03] ${
          withProgress || ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <HeroSceneClient
          mode={mode}
          interactive={false}
          quality={quality}
          paused={ready && !(onScreen && pageVisible)}
          onAssetProgress={handleAssetProgress}
          onAssetsReady={handleAssetsReady}
          onReady={handleReady}
          onCapture={onCapture}
        />
      </div>
      {withProgress && (
        <HeroLoadingProgress ceiling={ceiling} onFinished={handleFinished} />
      )}
    </>
  );
}
