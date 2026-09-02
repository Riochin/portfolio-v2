"use client";

import { useSyncExternalStore } from "react";

let support: boolean | null = null;

// 作れるコンテキストの数には上限があるので、確かめたぶんはその場で明示的に返し、
// 結果は使い回す。
function detect() {
  if (support !== null) return support;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    support = Boolean(gl);
  } catch {
    support = false;
  }
  return support;
}

const noopSubscribe = () => () => {};

/**
 * WebGL が使えるか。サーバでは分からないので null を返す。
 * null のあいだは静止画にも Canvas にも倒さない——サーバで静止画を描くと、
 * WebGL が使える大多数の環境で、水和した瞬間にそれが消えることになる。
 */
export function useWebGLSupported() {
  return useSyncExternalStore(
    noopSubscribe,
    detect,
    () => null as boolean | null,
  );
}
