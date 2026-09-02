"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { stripLocale } from "@/lib/i18n/paths";

/** globals.css の .chrome-toggle-out と同じ長さ。消えきってから器を畳む。 */
const EXIT_MS = 300;

/**
 * サイト共通のテーマ切替ボタン。ヒーロー(トップ)だけは page 側が下部中央に
 * 自前で置いているので、ここでは出さない。
 *
 * 演出はヒーローを出入りする回だけ ── 出るときはフェードイン、戻るときは
 * フェードアウト。直接 /works を開いたときや /works -> /about の横移動では
 * ボタンはずっとそこにあるので何も起きない。
 *
 * 判定は「前回の描画がヒーローだったか」で、レンダー中に state を詰め直す
 * (React の "前回の値と比べる" 定石)。effect にすると 1 フレーム素のまま
 * 見えてからフェードが始まってしまう。
 */
export function ChromeThemeToggle({
  ariaLabel,
  className,
}: {
  ariaLabel: string;
  /** 置き場所ごとの配置。ヒーローではこの器ごと消えるので、余白や
      absolute の指定は呼び出し側ではなくこちらに持たせる。 */
  className?: string;
}) {
  const pathname = usePathname();
  const isHero = stripLocale(pathname) === "/";

  const [wasHero, setWasHero] = useState(isHero);
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");
  // ヒーローを出入りするたびに増やす。key に使って CSS アニメーションを撒き直す。
  const [pass, setPass] = useState(0);

  if (wasHero !== isHero) {
    setWasHero(isHero);
    setPhase(isHero ? "out" : "in");
    setPass((n) => n + 1);
  }

  // 畳むのは animationend ではなくタイマーで待つ。アニメーションは
  // 裏タブでも prefers-reduced-motion でも止まりうるので、イベントを
  // 当てにするとボタンがヒーローに居残ってしまう。
  useEffect(() => {
    if (phase !== "out") return;
    const id = setTimeout(() => setPhase("idle"), EXIT_MS);
    return () => clearTimeout(id);
  }, [phase, pass]);

  // 退場中の 1 枚だけはヒーローでも描き続ける
  if (isHero && phase !== "out") return null;

  const motion =
    phase === "in"
      ? "chrome-toggle-in"
      : phase === "out"
        ? "chrome-toggle-out"
        : "";

  return (
    <div key={pass} className={`${className ?? ""} ${motion}`}>
      <ThemeToggle ariaLabel={ariaLabel} variant="chrome" />
    </div>
  );
}
