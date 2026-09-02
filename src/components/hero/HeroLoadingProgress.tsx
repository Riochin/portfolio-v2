"use client";

import { useEffect, useRef, useState } from "react";
import { SIGNATURE } from "./signature";

/** 上限へ寄っていく速さ(1/秒)。小さいほどゆっくり近づく */
const APPROACH = 1.8;
/** 書き上がるまでの最短時間(ms)。全部キャッシュ済みでも一瞬で終わらせない */
const MIN_DURATION = 900;
/** 書き終えてから開き始めるまでの間(ms) */
const HOLD = 320;
/** ベースラインをブロックの中心(=開き目)に合わせる寄せ。署名の箱に対する割合 */
const BASELINE = (SIGNATURE.baseline / SIGNATURE.height) * 100;
/** 上下へ開ききるまで(ms)。挨拶文を出す間合いにも使うので外へ出す */
export const OPEN_DURATION = 800;

/**
 * 読み込みが終わるまでのヒーロー。ブロックは出さず、書かれていく署名だけを見せる。
 * 進み具合はインクが伸びた長さで伝わる。
 *
 * 署名は単線フォントから起こした線(signature.ts)で、1 本ずつ
 * stroke-dashoffset を詰めて引く。順番は筆順そのままなので、ペンを上げて次へ
 * 飛ぶ間も含めて運筆になる。読み込みが詰まればペンも止まる。
 * ブロックは地色のシャッターで覆っているので、署名の周りには何も無く見える。
 *
 * 書き上がったら署名を引き、シャッターが上下へ退いて空が開く。
 *
 * ceiling は「今の段でここまでは進んでよい」という上限(0..1)で、呼び出し側が
 * 実測(チャンク取得・素材読み込み・初回フレーム)から決める。インクは指数で
 * そこへ寄るだけなので上限には届かず、実測が止まっても動きは止まらない。
 * 書き上がるのは本当に 1 枚描けたときだけ。
 *
 * 毎フレームの値は state に持たず、線の dashoffset へ直接書く。ここが再描画
 * すると隣の Canvas まで巻き込まれるため。
 */
export function HeroLoadingProgress({
  ceiling,
  onFinished,
}: {
  ceiling: number;
  /** 開き始めた合図 */
  onFinished: () => void;
}) {
  const inkRef = useRef<SVGSVGElement>(null);
  const ceilingRef = useRef(ceiling);
  const finishedRef = useRef(onFinished);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    ceilingRef.current = ceiling;
  }, [ceiling]);

  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    const ink = inkRef.current;
    if (!ink) return;

    const paths = [...ink.querySelectorAll("path")];
    // 何本目まで引き終えたかと、その合計の道のり。毎フレーム全部を触らずに済ませる
    let pen = 0;
    let inked = 0;

    const start = performance.now();
    let last = start;
    let value = 0;
    let frame = 0;
    let hold: ReturnType<typeof setTimeout> | undefined;

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;

      const target = ceilingRef.current;
      value += (target - value) * (1 - Math.exp(-APPROACH * delta));
      // 指数では届かないので、上限が 1 のときだけ最後を詰める
      if (target >= 1 && value > 0.995) value = 1;

      // 時間でも頭を押さえて、速いときでも数字が上がる様子が見えるようにする
      const display = Math.min(value, (now - start) / MIN_DURATION);
      // ペンはここまで進んでいる。引き終えた線のぶんを差し引いた残りを、
      // 今引いている線へ流し込む
      let remaining = display * SIGNATURE.totalLength - inked;
      for (let i = pen; i < paths.length; i += 1) {
        const { length } = SIGNATURE.strokes[i];
        const drawn = Math.min(remaining, length);
        paths[i].style.strokeDashoffset = String(length - drawn);
        if (drawn < length) break;
        // この線は引き終えた。次のフレームからは触らない
        remaining -= length;
        inked += length;
        pen = i + 1;
      }

      if (display >= 1) {
        // 書き上がったら署名を引き、ひと呼吸置いてから開く
        setDone(true);
        hold = setTimeout(() => {
          setOpen(true);
          finishedRef.current();
        }, HOLD);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      if (hold) clearTimeout(hold);
    };
  }, []);

  // ページと同じ地色で上下を覆い、開くときは transform で退かせる。
  // ブロックより一回り大きいのは、Canvas が別の合成レイヤになり角の丸みからも
  // 数ピクセルはみ出すため。その上まで覆ってしまう。
  const shutter =
    "pointer-events-none absolute -inset-x-1 h-[calc(50%+0.25rem)] bg-background transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]";
  const duration = { transitionDuration: `${OPEN_DURATION}ms` };

  return (
    <>
      <span
        aria-hidden
        style={duration}
        className={`${shutter} -top-1 ${open ? "-translate-y-full" : "translate-y-0"}`}
      />
      <span
        aria-hidden
        style={duration}
        className={`${shutter} -bottom-1 ${open ? "translate-y-full" : "translate-y-0"}`}
      />
      {/* 待っている間だけの署名。書き上がったら引き、そこから開く。
          読み上げでは何も欠けていないので装飾として隠す */}
      {!open && (
        <>
          {/* ベースラインをブロックの中心に置く。開くときの割れ目がちょうど
              字の足元を通るので、書き終わりからそのまま空へつながる */}
          <svg
            ref={inkRef}
            aria-hidden
            viewBox={`0 0 ${SIGNATURE.width} ${SIGNATURE.height}`}
            style={{ transform: `translate(-50%, -${BASELINE}%)` }}
            className={`pointer-events-none absolute left-1/2 top-1/2 z-10 w-[72%] overflow-visible text-accent transition-opacity duration-200 ${
              done ? "opacity-0" : "opacity-100"
            }`}
          >
            {SIGNATURE.strokes.map((stroke, i) => (
              <path
                key={i}
                d={stroke.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                // 署名の大きさは幅に追随させるが、線の太さは変えない
                vectorEffect="non-scaling-stroke"
                strokeDasharray={stroke.length}
                strokeDashoffset={stroke.length}
              />
            ))}
          </svg>
        </>
      )}
    </>
  );
}
