"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/useHydrated";

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
  align = "start",
}: {
  items: readonly NavItem[];
  heading: string;
  headingHref: string;
  ariaLabel: string;
  /** center はモバイルのメニュー用。見出しとピルを中央に据え、ピルを横いっぱいに広げる。 */
  align?: "start" | "center";
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // 計測ではなく CSS だけで成立させるため、帯は各リンクに重ねる。
  // ただし SSR / JS 無効時に色が消えないよう、素の背景を先に出しておき、
  // マウント後にアニメーションする帯へ引き継ぐ。
  const enhanced = useHydrated();

  // 入りはゆったり見せ、抜けは少し早めに引く
  const enterDuration = reduceMotion ? 0 : 0.6;
  const exitDuration = reduceMotion ? 0 : 0.4;
  const centered = align === "center";
  // 端まで届く帯は画面の縁に接するので、角を丸めると四隅がわずかに欠けて見える
  const rounded = centered ? "" : "rounded-xl";

  return (
    <nav aria-label={ariaLabel}>
      <Link
        href={headingHref}
        className={`mb-6 block font-logo text-4xl leading-none text-foreground transition-colors hover:text-accent ${centered ? "text-center" : ""}`}
      >
        {heading}
      </Link>
      {/* start: ピルの padding のぶんだけ左に寄せて、文字の左端を見出しと揃える。
          ピルは inline-block で、帯の幅は項目の文字の長さに合わせる。
          center: ピルを画面の左右の端まで伸ばし、文字を中央に置く。-mx-4 は
          MobileMenu のオーバーレイの px-4 を打ち消す分。行のどこを押しても
          リンクに当たるので、指で押すモバイルに向く。 */}
      <ul
        className={`flex flex-col gap-2 ${centered ? "-mx-4 text-center" : "-ml-4"}`}
      >
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative ${centered ? "block" : "inline-block"} ${rounded} px-4 py-1.5 transition-colors ${
                  isActive
                    ? enhanced
                      ? "text-foreground"
                      : "bg-accent text-white dark:text-background"
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
                        className={`pointer-events-none absolute inset-0 ${rounded} bg-accent`}
                      >
                        <span className="block whitespace-nowrap px-4 py-1.5 text-white dark:text-background">
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
