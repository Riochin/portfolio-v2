import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";

/** 本文の横幅 (PageShell の max-w-3xl = 48rem)。 */
const BODY_WIDTH = 768;

/**
 * 本文中の画像。rehypeImageSize がビルド時に刻んだ実寸で next/image に渡す。
 *
 * 寸法が取れなかったものだけ素の img に落とす。外部 URL の画像を手で書いた場合や、
 * public/ から消えた画像がこれに当たる。記事 1 枚のために描画ごと落とさない。
 */
export function MarkdownImage({
  src,
  alt,
  width,
  height,
  title,
}: ComponentPropsWithoutRef<"img">) {
  if (typeof src !== "string" || src === "") return null;

  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    // eslint-disable-next-line @next/next/no-img-element -- 寸法不明の画像は next/image に渡せない
    return <img src={src} alt={alt ?? ""} title={title} />;
  }

  return (
    <Image
      src={src}
      alt={alt ?? ""}
      title={title}
      width={w}
      height={h}
      sizes={`(max-width: ${BODY_WIDTH}px) 100vw, ${BODY_WIDTH}px`}
      className="h-auto w-full rounded-xl"
    />
  );
}
