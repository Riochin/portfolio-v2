"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/* hero は下部中央に単体で置く大きな丸ボタン。chrome は JP/EN の隣やフッターに
   並ぶ小さなアイコンで、枠を持たず周りの文字リンクと同じ重さに見せる。
   切替の演出はボタンの矩形からしか作らないので、大きさが変わっても
   「押した場所から円が開く」挙動はどちらも同じになる。 */
const VARIANTS = {
  hero: {
    className:
      "flex h-16 w-16 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent",
    icon: 24,
    placeholder: "h-6 w-6",
  },
  chrome: {
    className:
      "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-accent",
    icon: 18,
    placeholder: "h-[18px] w-[18px]",
  },
} as const;

export function ThemeToggle({
  ariaLabel,
  variant = "hero",
}: {
  ariaLabel: string;
  variant?: keyof typeof VARIANTS;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  const toggle = useCallback(() => {
    const next = isDark ? "light" : "dark";
    const button = buttonRef.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // View Transitions 非対応ブラウザ / reduced-motion では即時切替にフォールバック
    if (!button || prefersReducedMotion || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    // 起点は常にボタンの中心。クリック座標を使うと 64px のボタン内で数十 px
    // ぶれるだけで得はなく、キーボード操作時の 0,0 も踏まないで済む。
    //
    // 円は px ではなく ::view-transition-new(root) の箱に対する % で指定する。
    // このスナップショットは UA スタイルが block-size: auto なので、箱の大きさ
    // がビューポートと一致しない状況(スクロールバーの出入り、ビューポートと
    // スナップショット包含ブロックのずれ)では px の中心が左上へ流れる。
    // % なら箱がどう伸縮しても同じ相対位置に留まる。
    const rect = button.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = document.documentElement.clientHeight || window.innerHeight;
    const x = vw > 0 ? ((rect.left + rect.width / 2) / vw) * 100 : 50;
    const y = vh > 0 ? ((rect.top + rect.height / 2) / vh) * 100 : 50;

    // CSS 側の打ち消しをテーマ切替のときだけ効かせる目印
    // (ページ遷移のモーフに漏らさないため)
    document.documentElement.dataset.vt = "theme";

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.finished.finally(() => {
      delete document.documentElement.dataset.vt;
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            // % 半径は sqrt((w^2+h^2)/2) 基準。150% は箱の対角線(≒141%)より
            // 大きいので、起点がどの隅でも画面全体を覆い切る。
            clipPath: [
              `circle(0% at ${x}% ${y}%)`,
              `circle(150% at ${x}% ${y}%)`,
            ],
          },
          {
            duration: 1100,
            // easeInOutQuint。両端をほぼ寝かせてあるので、静止 → 一気に開く
            // → 縁がゆっくり止まる、という三拍子に読める。円は半径ではなく
            // 面積で速く見えるぶん、立ち上がりはこのくらい溜めて釣り合う。
            easing: "cubic-bezier(0.83, 0, 0.17, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        // タブが非表示などでキャプチャが中断されたケース。
        // update callback は走っているのでテーマ自体は切り替わっている。
      });
  }, [isDark, setTheme]);

  const style = VARIANTS[variant];

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      className={style.className}
    >
      {mounted ? (
        <span className="theme-icon flex items-center justify-center">
          {isDark ? <Moon size={style.icon} /> : <Sun size={style.icon} />}
        </span>
      ) : (
        <span className={style.placeholder} />
      )}
    </button>
  );
}
