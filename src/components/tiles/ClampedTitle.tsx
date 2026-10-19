"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * 決まった行数に収めるタイトル。溢れるときは文字を詰めて「…」を付け、
 * 後ろの飾り (外部リンクの印) は「…」の直後に残す。
 *
 * CSS の line-clamp を使わないのは 2 つの理由から。
 * - 印ごと切られる。「タイトルタイト…」で終わり、外部リンクだと分からなくなる。
 * - iOS の WebKit (iPhone の Chrome も含む) では、3 行に収まっているタイトルにも
 *   「…」が付く。PC の Chrome では起きない。
 *
 * サーバーで描く HTML と JS が動くまでは line-clamp で仮に切っておき、
 * 描いたあとに幅を測って文字数を決め直す。幅が変わるたびに測り直す。
 */
export function ClampedTitle({
  title,
  lines,
  className,
  srLabel,
  trailing,
}: {
  title: string;
  lines: number;
  /** 行数の仮止め (line-clamp-N) を含めた p のクラス。 */
  className: string;
  /** 画面には出さず、読み上げだけに足す補足。 */
  srLabel?: string;
  /** 「…」の後ろに残す飾り。 */
  trailing?: ReactNode;
}) {
  const boxRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const textNode = textRef.current?.firstChild;
    if (!box || !(textNode instanceof Text)) return;

    // 仮止めの line-clamp を外す。これ以降は文字数で切る。
    box.style.display = "block";
    box.style.overflow = "visible";
    box.style.webkitLineClamp = "unset";

    // 絵文字を半分で割らないよう、コードポイント単位で数える。
    const chars = Array.from(title);
    const fits = () => {
      const lineHeight = parseFloat(getComputedStyle(box).lineHeight);
      // 行の高さは印の縦位置で少しずれるので、半行ぶんの余裕を見て数える。
      return box.getBoundingClientRect().height < lineHeight * (lines + 0.5);
    };
    const show = (count: number) => {
      textNode.data =
        count >= chars.length
          ? title
          : `${chars.slice(0, count).join("").trimEnd()}…`;
    };

    let lastWidth = -1;
    const fit = () => {
      const width = box.getBoundingClientRect().width;
      if (width === lastWidth) return;
      lastWidth = width;

      show(chars.length);
      if (fits()) return;
      // 収まる最大の文字数を二分探索で探す。
      let low = 0;
      let high = chars.length - 1;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        show(mid);
        if (fits()) low = mid;
        else high = mid - 1;
      }
      show(low);
    };

    fit();
    // Web フォントが後から差し替わると字幅が変わるので、そこでも測り直す。
    document.fonts.ready.then(() => {
      lastWidth = -1;
      fit();
    });
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [title, lines]);

  return (
    <p ref={boxRef} className={className}>
      {/* 読み上げには切る前のタイトルを渡し、見た目の側は読ませない。 */}
      <span className="sr-only">
        {title}
        {srLabel && `（${srLabel}）`}
      </span>
      <span aria-hidden>
        <span ref={textRef}>{title}</span>
        {trailing}
      </span>
    </p>
  );
}
