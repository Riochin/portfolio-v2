"use client";

import {
  Suspense,
  lazy,
  useEffect,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from "react";
import type HeroScene from "./HeroScene";

let pending: Promise<typeof HeroScene> | null = null;

/**
 * three と drei は重いので初期バンドルには入れず、ここからだけ動的に取る。
 * Promise を握っておくのは、チャンクが降りてきた時点をローディングの
 * 進捗として使いたいため。呼び出し側が複数あっても取得は 1 回で、
 * 2 人目以降は解決済みを受け取る。
 */
export function loadHeroScene() {
  pending ??= import("./HeroScene").then((module) => module.default);
  return pending;
}

const LazyHeroScene = lazy(() =>
  loadHeroScene().then((component) => ({ default: component })),
);

/** チャンクが降りてきたか。ローディングの進捗に使う */
export function useHeroSceneLoaded() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    loadHeroScene().then(() => {
      if (alive) setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return loaded;
}

const noopSubscribe = () => () => {};

// three は DOM を前提にしているので、サーバでは絶対に描かせない
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function HeroSceneClient(props: ComponentProps<typeof HeroScene>) {
  const isClient = useIsClient();
  if (!isClient) return null;

  return (
    <Suspense fallback={null}>
      <LazyHeroScene {...props} />
    </Suspense>
  );
}
