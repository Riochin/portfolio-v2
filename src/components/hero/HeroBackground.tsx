import Image from "next/image";

// 展開後のライブ Canvas と同じ R3F シーン(sceneConfig.ts のカメラ/パラメータ)を
// 一度だけレンダリングして焼き込んだ静止画。初期表示で three.js を一切ロードせずに
// 全画面演出と地続きの絵を見せるための土台。
// 差し替えるときは /hero-capture から取り直す。
export function HeroBackground({ priority = false }: { priority?: boolean }) {
  return (
    <div className="absolute inset-0">
      <Image
        src="/hero-light.webp"
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover transition-opacity duration-700 dark:opacity-0"
      />
      <Image
        src="/hero-dark.webp"
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover opacity-0 transition-opacity duration-700 dark:opacity-100"
      />
    </div>
  );
}
