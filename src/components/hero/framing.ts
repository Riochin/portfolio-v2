"use client";

import { useSyncExternalStore } from "react";
import { HERO_FRAMING, UPRIGHT_QUERY, type HeroFraming } from "./sceneConfig";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(UPRIGHT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * この画面でヒーローを組む画枠。
 *
 * 見ている条件は globals.css の @custom-variant upright と同じ 1 本なので、
 * CSS が決める枠の比と、Canvas の中でカメラが向く先が食い違うことはない。
 * どちらか片方だけを触ると絵が壊れる ── 比だけ詰めれば主役が枠の外へ出るし、
 * yaw だけ振れば 16:9 の枠が右へずれる。両方を HERO_FRAMING の 1 行から出す。
 *
 * サーバでは wide に倒す。Canvas はどのみち水和のあとにしか作られないし、
 * CameraFraming が向きを持ち直すので、初回に取り違えても絵には出ない。
 */
export function useHeroFraming(): HeroFraming {
  const upright = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(UPRIGHT_QUERY).matches,
    () => false,
  );

  return upright ? HERO_FRAMING.narrow : HERO_FRAMING.wide;
}
