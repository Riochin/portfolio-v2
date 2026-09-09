"use client";

import { useSyncExternalStore } from "react";

/**
 * ハイドレーションが済んだかどうかを返す。サーバー描画と、それに続く最初の
 * ハイドレーション描画では false、その直後の再描画から true になる。
 *
 * サーバーでは決められないものを出し分けるのに使う。next-themes の
 * resolvedTheme (実際の配色は localStorage と OS 設定を見ないと決まらない)、
 * JS が動いて初めて成立する演出などが該当する。false のあいだはサーバーと
 * 同じ木を描くので、ハイドレーションの不一致にならない。
 *
 * useState(false) + useEffect(() => setState(true), []) と結果は同じ。ただし
 * あちらは効果の中で setState するので react-hooks/set-state-in-effect に
 * 引っかかる。useSyncExternalStore は「サーバーとクライアントで値が違う」
 * ことを getServerSnapshot で React に直接伝えられるので、効果を経由しない。
 *
 * 購読はしない。値が false から true へ動くのはハイドレーションの一度きりで、
 * それは React 自身が起こす再描画だから、通知する相手がいない。
 *
 *   const hydrated = useHydrated();
 *   if (!hydrated) return <Placeholder />;
 */
const subscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
