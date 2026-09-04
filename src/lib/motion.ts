import type { CSSProperties } from "react";

/**
 * 言葉が現れるときの尺と曲線。
 *
 * ヒーローの「近づいてみる」と、ナビのホバーで添える言い換えは、別々の
 * コンポーネントに別々の実装で置かれる。それでも「同じ手で作られている」と
 * 感じられるかは、この 2 つの値が完全に一致しているかで決まるので、
 * クラス名 (duration-* / ease-*) に散らさず、ここ 1 箇所だけに持たせる。
 *
 * 曲線は easeOutCubic ── globals.css の reveal-rise と同じもの。立ち上がりが
 * 極端でないぶん、350ms の大半が実際の動きとして読める (easeOutQuint だと
 * 9 割を 150ms で消化してしまい、「出た」ではなく「点いた」に見える)。
 */
export const REVEAL_MS = 350;
export const REVEAL_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

/** そのまま style に渡す。transition-* のクラスと併せて使う。 */
export const revealTransition: CSSProperties = {
  transitionDuration: `${REVEAL_MS}ms`,
  transitionTimingFunction: REVEAL_EASE,
};
