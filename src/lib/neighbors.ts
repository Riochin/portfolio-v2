/**
 * 一覧の並びで見た「1 つ上」と「1 つ下」。
 *
 * 詳細ページ末尾のページャ (DetailPager) が使う。Works と記事で母集団も
 * 並び順も違うが、境界の扱いだけは同じなのでここに畳んである。
 *
 * prev / next を「新しい / 古い」ではなく一覧の上下で定義しているのが要点。
 * Works は制作期間の降順、記事は公開日の降順と並びの根拠が違うので、
 * 時系列で名乗ると読み手の感覚が揃わない。
 */
export type Neighbors<T> = {
  readonly prev?: T;
  readonly next?: T;
};

/**
 * list の index 番目から見た前後。index が -1 (= 一覧に居ない) なら両方無し。
 *
 * 範囲を明示的に判定しているのは tsconfig が noUncheckedIndexedAccess を
 * 入れていないため。list[index - 1] は T | undefined ではなく T に型付くので、
 * 範囲外を undefined として扱ってはくれない。
 * .at() も使わない ── at(-1) は末尾に巻き戻るので、index === 0 のときに
 * 「一覧の最後の 1 件」が前として生えてしまう。
 */
export function neighborsAt<T>(
  list: readonly T[],
  index: number,
): Neighbors<T> {
  if (index < 0) return {};

  return {
    prev: index > 0 ? list[index - 1] : undefined,
    next: index < list.length - 1 ? list[index + 1] : undefined,
  };
}
