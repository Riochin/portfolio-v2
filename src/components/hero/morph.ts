"use client";

import { useCallback, useEffect, useState } from "react";

// onLayoutAnimationComplete が発火しないケースへの保険。ばねが収まるころ
// (stiffness 200 / damping 26 で 0.7 秒ほど) に自分で開ける。
const SETTLE_DELAY = 900;

/**
 * ブロックと全画面を行き来するモーフが収まったか。
 *
 * モーフの最中は要素に transform がかかっており、R3F はその変形後の
 * bounding rect を測って、そのサイズで固定してしまう。以降は要素の
 * レイアウト上の大きさが変わらない (transform が抜けるだけ) ので
 * ResizeObserver も鳴らず、ずれたまま残る。Canvas はモーフが収まって
 * から作る。
 *
 * @param deferred 待つ必要があるか。モーフを挟まない初回は待たずに開ける。
 * @returns [収まったか, 収まった合図を出す関数]
 */
export function useMorphSettled(deferred: boolean) {
  const [settled, setSettled] = useState(!deferred);
  const markSettled = useCallback(() => setSettled(true), []);

  useEffect(() => {
    if (!deferred) return;
    const timer = setTimeout(markSettled, SETTLE_DELAY);
    return () => clearTimeout(timer);
  }, [deferred, markSettled]);

  return [settled, markSettled] as const;
}
