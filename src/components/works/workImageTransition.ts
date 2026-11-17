import type { ViewTransitionClass } from "react";

/**
 * 一覧タイルと詳細ページの hero を結ぶ view transition の名前。
 *
 * WorkGrid ではなくここに置いてあるのは、WorkGrid が "use client" だから。
 * クライアントモジュールの export は Server Component 側ではクライアント参照に
 * 差し替わるので、詳細ページ (Server Component) から呼ぶと実行時に落ちる。
 */
export function workImageTransitionName(slug: string): string {
  return `work-image-${slug}`;
}

/**
 * 詳細 -> 一覧のブラウザバックに付ける transition type。
 * この戻りだけは React にペアを作らせず、workBackMorph が名前を手で付ける。
 */
export const WORK_BACK_TRANSITION_TYPE = "work-back-manual";

/**
 * 一覧タイルと詳細 hero の share。普段は morph、WORK_BACK_TRANSITION_TYPE の
 * ときだけ none にして React のペアを切る。
 *
 * React は画面外の要素とペアを作らない (詳細をスクロールして画像が外に出て
 * から戻ると、名前を付けたあとで外してしまう) ので、その戻りがパッと切り替わる。
 * 手で付けた名前ならブラウザは画面外でも撮るので、モーフが残る。
 */
export const WORK_IMAGE_SHARE: ViewTransitionClass = {
  [WORK_BACK_TRANSITION_TYPE]: "none",
  default: "morph",
};
