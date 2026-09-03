import { UPRIGHT_QUERY } from "./sceneConfig";

// 展開後のライブ Canvas と同じ R3F シーン(sceneConfig.ts のカメラ/パラメータ)を
// 一度だけレンダリングして焼き込んだ静止画。初期表示で three.js を一切ロードせずに
// 全画面演出と地続きの絵を見せるための土台。
// 差し替えるときは /hero-capture から取り直す (画枠ごとに 2 枚ずつ)。
//
// 画枠は 2 つある。無印が 16:9 (1280x720)、-narrow が 4:3 (960x720) で、
// ライブ側が枠の比とカメラの yaw を切り替えるのと同じ境目で入れ替える。
// 1 枚を object-cover で両方に流すと、縦長の枠では左右が削られて、
// ライブと静止画で主役の入道雲の位置が食い違ってしまう。
//
// <picture> で出すのは、next/image に media 別の差し替え (アートディレクション)
// が無いため。元から /public に置いた寸法どおりの webp で、変換して得るものも
// 無いので、ここは素の img でよい。
function Poster({
  mode,
  priority,
  className,
}: {
  mode: "light" | "dark";
  priority: boolean;
  className: string;
}) {
  return (
    <picture>
      {/* globals.css の @custom-variant upright と同じ 1 本。片方だけ動かすと
          枠とポスターの比がずれる */}
      <source media={UPRIGHT_QUERY} srcSet={`/hero-${mode}-narrow.webp`} />
      {/* データの実体は /public の静的ファイル 1 枚きり */}
      <img
        src={`/hero-${mode}.webp`}
        alt=""
        aria-hidden
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    </picture>
  );
}

export function HeroBackground({ priority = false }: { priority?: boolean }) {
  return (
    <div className="absolute inset-0">
      <Poster
        mode="light"
        priority={priority}
        className="transition-opacity duration-700 dark:opacity-0"
      />
      <Poster
        mode="dark"
        priority={priority}
        className="opacity-0 transition-opacity duration-700 dark:opacity-100"
      />
    </div>
  );
}
