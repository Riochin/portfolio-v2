"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  const toggle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
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

    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // 起点はクリック座標を最優先(常にビューポート基準で確実)。
    // キーボード操作時は clientX/Y が 0 になるのでボタンの矩形にフォールバックし、
    // それも measure できない場合はトグルの定位置(下部中央)を使う。
    const rect = button.getBoundingClientRect();
    let x = event.clientX || rect.left + rect.width / 2;
    let y = event.clientY || rect.top + rect.height / 2;

    if (!Number.isFinite(x) || x <= 0 || x >= vw) x = vw / 2;
    if (!Number.isFinite(y) || y <= 0 || y >= vh) y = vh - 72;

    // 画面の最も遠い隅まで届く半径
    const radius = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }, [isDark, setTheme]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggle}
      aria-label="テーマを切り替え"
      className="flex h-16 w-16 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
    >
      {mounted ? (
        <span className="theme-icon flex items-center justify-center">
          {isDark ? <Moon size={24} /> : <Sun size={24} />}
        </span>
      ) : (
        <span className="h-6 w-6" />
      )}
    </button>
  );
}
