"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * 「とじる」で畳んだとき、押したボタンを画面上の同じ場所に留める。
 *
 * 「もっとみる」はグリッドの最後のタイルなので、畳むとボタン自身の居場所が
 * 前に詰まる (3 列なら 9 番目のスロット -> 6 番目のスロット = 1 行ぶん上)。
 * 何もしないと、押した瞬間にボタンが指の下から逃げ、下のセクションが
 * 数百 px せり上がる。
 *
 * Chrome は scroll anchoring がこれを勝手に吸収するので、そこでは補正値が
 * ほぼ 0 になり何もしないのと同じ。効くのは scroll anchoring を持たない
 * WebKit で、実測 (2026-09-04) では anchoring を切った条件だと
 * 3 列 14 件で 793px、1 列 14 件では 1332px 飛んでいた。
 *
 * 開くときには当てない。ボタンが下へ動くのは「下に中身が増えた」ことの
 * 表れなので、そのまま押し下げてよい。
 *
 * 使い方: 畳む state を変える直前に、返ってきた関数を呼ぶ。
 *
 *   const anchor = useCollapseAnchor(buttonRef);
 *   if (expanded) anchor();
 *   setExpanded(!expanded);
 *
 * @param onSettled 畳み終わって視点を戻し切った直後に呼ばれる。描画前なので、
 *   ここで動きを足せば 1 フレームも余さずに繋がる (useCollapseMotion が使う)。
 */
export function useCollapseAnchor(
  ref: RefObject<HTMLElement | null>,
  onSettled?: () => void,
) {
  /** 畳む直前に測ったボタンの上端 (viewport 座標)。相殺したら null に戻す。 */
  const anchorTop = useRef<number | null>(null);

  // 依存配列を持たない = 毎レンダー走るが、印が立っていなければ即座に降りる。
  // useEffect ではなく useLayoutEffect なのは、描画前に相殺を済ませるため。
  // 描画を挟むと、ずれた 1 フレームがちらつきとして見えてしまう。
  useLayoutEffect(() => {
    const before = anchorTop.current;
    if (before === null) return;
    anchorTop.current = null;

    const el = ref.current;
    if (el) {
      // getBoundingClientRect() はレイアウトを確定させるので、ページが縮んだ
      // ぶんブラウザがスクロールを切り詰める分も、scroll anchoring が動く環境で
      // それが保った分も、ここに織り込まれている。相殺は残りの差だけでよい。
      const delta = el.getBoundingClientRect().top - before;
      // 動きを足すのではなく消すための移動なので、常に瞬間。
      // (prefers-reduced-motion でも同じ扱いでよい)
      if (delta !== 0) window.scrollBy({ top: delta, behavior: "instant" });
    }

    onSettled?.();
  });

  return () => {
    anchorTop.current = ref.current?.getBoundingClientRect().top ?? null;
  };
}
