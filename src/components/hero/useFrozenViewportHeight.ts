"use client";

import { useLayoutEffect } from "react";

/**
 * ヒーローの高さを、最初に測った 100svh / 100lvh の px で止めて
 * `--hero-h` / `--hero-lh` に置く。中身は svh、外枠は lvh で描く (page.tsx)。
 *
 * Safari や Chrome はツールバーの出入りを知っているので svh は動かないが、
 * LINE などのアプリ内ブラウザは表示の枠 (WebView) ごと縦に伸び縮みさせる。
 * ページからは窓の大きさが変わったようにしか見えず、vh / svh / lvh / dvh が
 * 揃って動く (riochin.github.io/vh-probe で実測)。CSS の単位ではどれを選んでも
 * 止まらないので、最初の値を握っておく。
 *
 * 測り直すのは幅が変わったとき (回転) だけ。高さだけの変化はツールバーの
 * 出入りとみなして無視する。ただしマウスの端末 (PC) では窓を縦に伸ばす
 * こともあるので、高さだけの変化でも測り直す。
 *
 * 測る前と JS が無いときは 100svh / 100lvh のまま描く (使う側が
 * var(--hero-h, 100svh) / var(--hero-lh, 100lvh) で受ける)。
 */
export function useFrozenViewportHeight() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const probe = (height: string) => {
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;top:0;left:0;width:0;height:${height};visibility:hidden;pointer-events:none`;
      return el;
    };
    const small = probe("100svh");
    const large = probe("100lvh");

    const touch = window.matchMedia("(pointer: coarse)").matches;
    let width = -1;
    const measure = () => {
      if (touch && window.innerWidth === width) return;
      width = window.innerWidth;
      document.body.append(small, large);
      root.style.setProperty("--hero-h", `${small.getBoundingClientRect().height}px`);
      root.style.setProperty("--hero-lh", `${large.getBoundingClientRect().height}px`);
      small.remove();
      large.remove();
    };

    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      root.style.removeProperty("--hero-h");
      root.style.removeProperty("--hero-lh");
    };
  }, []);
}
