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
