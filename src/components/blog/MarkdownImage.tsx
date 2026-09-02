import Image from "next/image";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** 本文の横幅 (PageShell の max-w-3xl = 48rem)。 */
const BODY_WIDTH = 768;

/** 等倍とみなす幅。studio 側の判定と揃える。 */
const FULL_SIZE_EPSILON = 0.005;

/**
 * 本文中の画像。rehypeImageSize がビルド時に刻んだ実寸で next/image に渡す。
 *
 * studio で縮めた画像は `data-scale` を持って来る。これは本文幅に対する幅の割合で、
 * 縦横比はそのまま ── エディタ側の img が width 指定を持たない (auto) ため、
 * 高さを動かすと幅も比例して動く作りになっている。こちらも幅を割合で与えて
 * 高さを auto にすれば、同じ見え方になる。
 *
 * キャプション (Markdown の title) は figcaption として見える形で出す。
 * title 属性のままだとホバーしないと読めず、エディタでは画像の下に見えている
 * ものが公開ページで消えたように見えてしまう。
 */
export function MarkdownImage({
  src,
  alt,
  width,
  height,
  title,
  ...rest
}: ComponentPropsWithoutRef<"img">) {
  if (typeof src !== "string" || src === "") return null;

  /**
   * studio の画像ブロックには alt を書く欄が無く、書けるのはキャプションだけ。
   * alt が空のときはキャプションで代える ── 読み上げに何も渡らないよりはよい。
   */
  const label = alt || title || "";

  const parsed = Number((rest as Record<string, unknown>)["data-scale"]);
  const scale =
    Number.isFinite(parsed) && parsed > 0 && Math.abs(parsed - 1) > FULL_SIZE_EPSILON
      ? parsed
      : 1;
  const style = { width: `${scale * 100}%` };

  const w = Number(width);
  const h = Number(height);
  const hasSize = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;

  // 縮めたぶんは srcset の選択にも効かせる。等倍と同じ sizes を渡すと、
  // 実際には要らない大きさの画像を取りに行ってしまう。
  const sizes = `(max-width: ${BODY_WIDTH}px) ${Math.round(scale * 100)}vw, ${Math.round(BODY_WIDTH * scale)}px`;

  const picture: ReactNode = hasSize ? (
    <Image
      src={src}
      alt={label}
      width={w}
      height={h}
      sizes={sizes}
      className="mx-auto block h-auto rounded-xl"
      style={style}
    />
  ) : (
    // 寸法が取れないもの ── 主に外部 URL の画像。rehypeImageSize は public/ の
    // 実ファイルしか読まないので next/image に渡せず、最適化もされない。
    // 倍率だけは効かせる (無視すると studio で縮めたのに全幅で出てしまう)。
    // eslint-disable-next-line @next/next/no-img-element -- 寸法不明の画像は next/image に渡せない
    <img
      src={src}
      alt={label}
      className="mx-auto block h-auto rounded-xl"
      style={style}
    />
  );

  if (!title) return picture;

  return (
    <figure>
      {picture}
      <figcaption>{title}</figcaption>
    </figure>
  );
}
