/**
 * トップの Recent talks のタイルと /output の一覧タイルを結ぶ
 * view transition の名前。「すべての登壇資料を見る」で移るとき、トップの
 * サムネイルが /output の同じタイルの位置へ滑って広がる (Works と同じ作り)。
 *
 * 出どころの URL から作る。view-transition-name は CSS の識別子なので、
 * 英数字以外はハイフンに潰す。OutputGrid は "use client" なので、
 * workImageTransition.ts と同じ理由でここ (サーバーからも呼べる場所) に置く。
 */
export function outputImageTransitionName(url: string): string {
  return `output-image-${url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")}`;
}
