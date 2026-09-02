"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type NavItem = {
  /** ロケール接頭辞まで解決済みの href。組み立ては SiteChrome (server) が行う。 */
  readonly href: string;
  readonly label: string;
};

/* アクセントの帯は clip-path で出し入れする。
   入るときは右側を刈り込んだ状態から開いて左→右へワイプイン、
   抜けるときは左側を刈り込んで右端へ吸い込まれるようにワイプアウトする。
   角丸は帯自身の border-radius が持つので、ここは矩形で刈るだけでよい。 */
const CLIP_FULL = "inset(0% 0% 0% 0%)";
const CLIP_LEFT = "inset(0% 100% 0% 0%)";
const CLIP_RIGHT = "inset(0% 0% 0% 100%)";

export function SideNav({
  items,
  heading,
  headingHref,
  ariaLabel,
}: {
  items: readonly NavItem[];
  heading: string;
  headingHref: string;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // 計測ではなく CSS だけで成立させるため、帯は各リンクに重ねる。
  // ただし SSR / JS 無効時に色が消えないよう、素の背景を先に出しておき、
  // マウント後にアニメーションする帯へ引き継ぐ。
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);

  // 入りはゆったり見せ、抜けは少し早めに引く
  const enterDuration = reduceMotion ? 0 : 0.6;
  const exitDuration = reduceMotion ? 0 : 0.4;

  return (
    <nav aria-label={ariaLabel}>
      <Link
        href={headingHref}
        className="mb-6 block text-xl font-bold text-foreground transition-colors hover:text-accent"
      >
        {heading}
      </Link>
      {/* ピルの padding のぶんだけ左に寄せて、文字の左端を見出しと揃える */}
      <ul className="-ml-4 flex flex-col gap-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative inline-block rounded-xl px-4 py-1.5 transition-colors ${
                  isActive
                    ? enhanced
                      ? "text-foreground"
                      : "bg-accent text-white"
                    : "text-foreground hover:text-accent"
                }`}
              >
                <span>{item.label}</span>
                {enhanced && (
                  // 退場アニメーションのあいだ帯を残したいので AnimatePresence を使う。
                  // initial={false} で、マウント直後(初回表示)は動かさず即座に出す。
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span
                        aria-hidden
                        initial={{ clipPath: CLIP_LEFT }}
                        animate={{ clipPath: CLIP_FULL }}
                        exit={{
                          clipPath: CLIP_RIGHT,
                          // 抜けは CSS の ease と同じ曲線
                          transition: {
                            duration: exitDuration,
                            ease: [0.25, 0.1, 0.25, 1],
                          },
                        }}
                        transition={{
                          duration: enterDuration,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="pointer-events-none absolute inset-0 rounded-xl bg-accent"
                      >
                        <span className="block whitespace-nowrap px-4 py-1.5 text-white">
                          {item.label}
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
