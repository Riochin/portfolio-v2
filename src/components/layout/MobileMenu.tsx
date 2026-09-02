"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SideNav, type NavItem } from "./SideNav";
import { SocialLinks } from "./SocialLinks";

export type MenuLabels = {
  readonly open: string;
  readonly close: string;
  readonly mainNav: string;
};

/* ヘッダー行の高さ。ワードマーク (font-logo / text-3xl / leading-none) の
   行送りと同じ 1.875rem に固定し、オーバーレイ側の余白もこれに合わせる。
   こうしておくと開閉でアイコンの天地が動かない。 */
const HEADER_ROW = "flex h-[1.875rem] items-center";

/* ☰ の 3 本線。閉じるときは上下を中央へ寄せてから傾け、真ん中を消して × にする。
   アイコンを 2 種類差し替えるのではなく同じ線を動かすので、開閉が地続きに見える。 */
const BAR = "absolute left-0 h-0.5 w-full rounded-full bg-current";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function MobileMenu({
  items,
  heading,
  headingHref,
  labels,
  languageSwitcher,
  wordmark,
}: {
  items: readonly NavItem[];
  heading: string;
  headingHref: string;
  labels: MenuLabels;
  /** Server Component 側で組み立てたものを slot として受け取る */
  languageSwitcher: React.ReactNode;
  wordmark: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const morph = { duration: reduceMotion ? 0 : 0.34, ease: EASE };
  const fade = { duration: reduceMotion ? 0 : 0.28, ease: EASE };

  return (
    <div className="md:hidden">
      {/* オーバーレイはヘッダーより先に置く。同じ z-40 なので後勝ちで
          ヘッダーが上に残り、トグルボタンが開いている間も押せる。 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            className="fixed inset-0 z-40 flex flex-col bg-background/95 px-4 py-4 backdrop-blur-sm"
          >
            {/* ヘッダー行のぶんの place holder。ボタン自体はヘッダー側にある */}
            <div aria-hidden className={HEADER_ROW} />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: 8,
                transition: { duration: reduceMotion ? 0 : 0.2, ease: EASE },
              }}
              transition={{ ...morph, delay: reduceMotion ? 0 : 0.06 }}
              className="mt-10 flex flex-1 flex-col gap-10 text-lg"
              onClick={() => setOpen(false)}
            >
              <SideNav
                items={items}
                heading={heading}
                headingHref={headingHref}
                ariaLabel={labels.mainNav}
              />
              <SocialLinks direction="row" />
              {languageSwitcher}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ハンバーガーとワードマークを 1 行に収めてヘッダーにする。
          行の高さはワードマークが決め、ボタンは枠も背景も持たず
          アイコンだけをその行の中央に置く。
          帯そのものをぼかして下端に境界線を引き、本文が下を流れても
          ワードマークとアイコンの可読性を保つ。 */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        {/* ワードマークは画面中央に据えたいので、ボタンのぶんだけずれないよう
            ボタン側を絶対配置で左端に逃がす。 */}
        <div className={`relative justify-center ${HEADER_ROW}`}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? labels.close : labels.open}
            aria-expanded={open}
            className="pointer-events-auto absolute inset-y-0 left-0 flex items-center text-foreground transition-colors hover:text-accent"
          >
            <span aria-hidden className="relative block h-[1.125rem] w-6">
              <motion.span
                className={`${BAR} top-0`}
                animate={{ y: open ? 8 : 0, rotate: open ? 45 : 0 }}
                transition={morph}
              />
              <motion.span
                className={`${BAR} top-1/2 -mt-px`}
                animate={{ opacity: open ? 0 : 1, scaleX: open ? 0.4 : 1 }}
                transition={morph}
              />
              <motion.span
                className={`${BAR} bottom-0`}
                animate={{ y: open ? -8 : 0, rotate: open ? -45 : 0 }}
                transition={morph}
              />
            </span>
          </button>
          {/* 開いている間はオーバーレイ内の SideNav 見出しが同じ役割を担うので、
            二重に出さないようこちらは伏せる */}
          <motion.div
            aria-hidden={open}
            animate={{ opacity: open ? 0 : 1 }}
            transition={fade}
            style={{ pointerEvents: open ? "none" : "auto" }}
          >
            {wordmark}
          </motion.div>
        </div>
      </header>
    </div>
  );
}
