"use client";

import { useRef, type RefObject } from "react";
import { useCollapseAnchor } from "./useCollapseAnchor";

/**
 * 消えるカードが一斉に薄くなる尺。
 * ばらけさせない ── 個々を見送るのではなく「まとめて引く」ので、一斉が正しい。
 */
const FADE_OUT_MS = 150;

/** 消えるほうの曲線。加速側で、終わりぎわに一気に抜ける。 */
const FADE_OUT_EASING = "cubic-bezier(0.4, 0, 1, 1)";

/**
 * 残ったカードが降ってくる尺。
 *
 * 入場 (globals.css の reveal-rise = 400ms / stagger 60ms) より詰めてある。
 * あちらは「これから読むものが並ぶ」ので溜めがあってよいが、こちらは畳んだ
 * 結果の後始末なので、同じ長さだと閉じ切るまでが重い。
 */
const FALL_MS = 280;
const FALL_STAGGER_MS = 40;

/** 降ってくる高さ。reveal-rise と同じにして、動きの語彙を揃える。 */
const FALL_DISTANCE = 20;

/** reveal-rise と同じ easeOutCubic。 */
const FALL_EASING = "cubic-bezier(0.33, 1, 0.68, 1)";

/** 薄くしたカード 1 枚。畳んだあと跡を消すために控えておく。 */
type Faded = { el: HTMLElement; animation: Animation };

function isOnScreen(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  // 畳んだあと max-sm:hidden で伏せられたものは全部 0 になるので、ここで落ちる。
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

/** グリッドのタイル (= 「もっとみる」ボタンの <li> を除いた子)。 */
function tilesOf(list: Element, buttonItem: Element) {
  return (Array.from(list.children) as HTMLElement[]).filter(
    (el) => el !== buttonItem,
  );
}

/**
 * 「とじる」に手順を付ける。
 *
 *   1. 消えるカードが一斉にフェードアウト   (FADE_OUT_MS)
 *   2. 畳む。視点は useCollapseAnchor がボタンに固定する
 *   3. 新しく画面へ入ってきたカードが降ってくる (FALL_MS + stagger)
 *
 * ## なぜ 3 が「新しく入ってきたぶん」だけなのか
 *
 * 視点がボタンに固定される結果、**畳んだ後にボタンの上へ来るカードは、押す前は
 * たいてい画面の外に居る** ── 押す前にそこへ映っていたのは 4〜5 行目だから。
 * だから降下は再生し直しではなく、本当に新しく入ってくるものの入場になる。
 *
 * ただし常にそうとは限らない。作品 4 件のセクション (1 列でだけ畳める) は
 * 消えるのが 1 枚で、残り 3 枚は元から画面に映っている。そこで降らせると
 * 見えていたカードが一度消えて落ちてくるだけの無駄な瞬きになるので、
 * 押す前に画面外だったものに限る。両方混ざっていれば混ざったぶんだけ降りる。
 *
 * 開く側は何も足さない。あちらは今までどおり reveal-rise が 1 件ずつ出す。
 *
 * 使い方:
 *
 *   const collapse = useCollapseMotion(buttonRef);
 *   if (expanded) collapse(PREVIEW_COUNT, () => setExpanded(false));
 *   else setExpanded(true);
 */
export function useCollapseMotion(ref: RefObject<HTMLElement | null>) {
  /** フェードアウトの最中か。抜け切るまで、もう一度押されても数えない。 */
  const busy = useRef(false);

  /** 薄くしたカード。畳み終わったら元に戻す。 */
  const faded = useRef<Faded[]>([]);

  /** 押した時点で画面外だった生き残り。畳んだ後に入ってきたものが降る。 */
  const awaited = useRef<HTMLElement[]>([]);

  const anchor = useCollapseAnchor(ref, () => {
    // 薄くした跡を戻す。畳んでも DOM から消えないカードがある ── 1 列では
    // 4 件目以降が max-sm:hidden で伏せられるだけなので、放っておくと
    // 次に開いたとき透明のまま戻ってくる。この時点で対象は既に display:none
    // か DOM から外れているので、戻しても何も瞬かない。
    for (const { el, animation } of faded.current) {
      animation.cancel();
      el.style.opacity = "";
    }
    faded.current = [];

    // 押す前は画面外に居て、畳んだ結果いま画面に入ったものだけ降らせる。
    const arriving = awaited.current.filter(isOnScreen);
    awaited.current = [];
    for (const [index, el] of arriving.entries()) {
      el.animate(
        [
          { opacity: 0, transform: `translateY(${FALL_DISTANCE}px)` },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: FALL_MS,
          delay: index * FALL_STAGGER_MS,
          easing: FALL_EASING,
          // 待っているあいだは伏せておく。reveal-rise の backwards と同じ。
          fill: "backwards",
        },
      );
    }
  });

  return (keepCount: number, collapse: () => void) => {
    if (busy.current) return;

    const button = ref.current;
    const list = button?.closest("ul");
    const buttonItem = button?.closest("li");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const commit = () => {
      if (list && buttonItem && !reduced) {
        awaited.current = tilesOf(list, buttonItem)
          .slice(0, keepCount)
          .filter((el) => !isOnScreen(el));
      }
      anchor();
      collapse();
    };

    if (reduced || !list || !buttonItem) {
      commit();
      return;
    }

    const leaving = tilesOf(list, buttonItem).slice(keepCount).filter(isOnScreen);
    if (leaving.length === 0) {
      commit();
      return;
    }

    faded.current = leaving.map((el) => ({
      el,
      animation: el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: FADE_OUT_MS,
        easing: FADE_OUT_EASING,
        // 抜けたまま留めておく。畳む更新が来るまでの数フレームで戻ると、
        // 消える寸前に一度だけ瞬く。
        fill: "forwards",
      }),
    }));

    // 抜け切るのを Animation.finished で待たないのは、タイムラインが止まる状況
    // (裏に回ったタブなど) で永久に解決されず、ボタンが死ぬため。時計で待つ。
    busy.current = true;
    window.setTimeout(() => {
      busy.current = false;
      commit();
    }, FADE_OUT_MS);
  };
}
