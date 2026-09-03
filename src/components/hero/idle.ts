"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 操作が途切れたら false へ落ち、次の操作で true へ戻る目印。
 *
 * 見回している間 pointermove は毎フレーム飛んでくるので、通知のたびに
 * 状態を触らず ref で今の値を持っておく。再レンダリングは実際に
 * 消える / 戻る 2 回だけで済む。
 *
 * @param delay 何も来なくなってから false にするまでの間 (ms)
 * @param held 消したくない事情があるか (ホバー中・フォーカス中など)。
 *             true の間はタイマーを張らず、出したままにする。
 * @returns [今出しておくか, 操作があったと伝える関数]
 */
export function useIdleVisible(delay: number, held = false) {
  const [visible, setVisible] = useState(true);
  const shown = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((next: boolean) => {
    if (shown.current === next) return;
    shown.current = next;
    setVisible(next);
  }, []);

  const restart = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (held) return;
    timer.current = setTimeout(() => show(false), delay);
  }, [delay, held, show]);

  const notify = useCallback(() => {
    show(true);
    restart();
  }, [restart, show]);

  useEffect(() => {
    // held が立った回はまず出し直す。狙って近づいた先が消えていては困る。
    if (held) show(true);
    restart();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [held, restart, show]);

  return [visible, notify] as const;
}
