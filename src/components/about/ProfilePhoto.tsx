"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { ImageRef } from "@/data/types";

/** globals.css の .photo-lightbox-out と同じ長さ。消えきってから外す。 */
const EXIT_MS = 200;

/** 拡大したときの一辺。ビューポートからはみ出さない範囲で、顔が見える大きさ。 */
const EXPANDED_SIZE = "min(80vw, 80vh, 30rem)";

/**
 * プロフィール写真。押すと画面中央で拡大する。
 *
 * 演出はヒーローの全画面表示 (framer-motion の layoutId で枠ごとモーフ)
 * とは別の作りにしてある。このブロックの親が reveal-rise を持っていて、
 * その CSS の transform が走っている最中の箱を framer のレイアウト投影が
 * 測ってしまい、サムネイルが潰れた形で固定されるため。ここは幕のフェードと
 * 写真の寄りだけを CSS で行う (rAF が止まる裏タブでも幕が残らない)。
 *
 * サムネイルは開いている間も出したままにする。拡大側は別の要素なので、
 * ヒーローのように元を外す必要がなく、閉じたときに穴も空かない。
 */
export function ProfilePhoto({
  photo,
  alt,
  expandLabel,
  closeLabel,
}: {
  photo: ImageRef;
  /** 翻訳済みの代替テキスト。サーバー側で t() を通したものを受け取る。 */
  alt: string;
  expandLabel: string;
  closeLabel: string;
}) {
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // 外すのは animationend ではなくタイマーで待つ。アニメーションは裏タブでも
  // prefers-reduced-motion でも止まりうるので、イベントを当てにすると
  // 幕が画面に居残ってしまう (ChromeThemeToggle と同じ判断)。
  useEffect(() => {
    if (phase !== "closing") return;
    const id = setTimeout(() => setPhase("closed"), EXIT_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // 開いたら閉じるボタンへフォーカスを移し、閉じたら写真へ戻す。
  // キーボードだけで開いた人が、幕の裏のページを辿る羽目にならないように。
  //
  // 戻す側は「一度開いた後か」で絞る。phase の初期値も "closed" なので、
  // 素直に書くとページを開いただけで写真へフォーカスが飛び、そこまで
  // スクロールさせられてしまう。
  const hasOpened = useRef(false);
  useEffect(() => {
    if (phase === "open") {
      hasOpened.current = true;
      closeRef.current?.focus();
    }
    if (phase === "closed" && hasOpened.current) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("closing");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setPhase("open")}
        aria-label={expandLabel}
        className="group block h-40 w-40 cursor-pointer overflow-hidden rounded-full outline-accent outline-offset-4 focus-visible:outline-2"
      >
        <Image
          src={photo.src}
          alt={alt}
          width={photo.width}
          height={photo.height}
          priority
          sizes="160px"
          // 押せることの合図。ジャケットのホバーと同じ寄り方に揃える。
          className="photo-frame h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06] motion-reduce:transition-none"
        />
      </button>

      {phase !== "closed" && (
        /* 幕のどこを押しても閉じる。拡大した写真の上も同じで、閉じ方を
           探させない (ボタンは右上にも置いてある)。 */
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setPhase("closing")}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm ${
            phase === "open" ? "photo-lightbox-in" : "photo-lightbox-out"
          }`}
        >
          <div
            style={{ width: EXPANDED_SIZE, height: EXPANDED_SIZE }}
            className="photo-lightbox-figure overflow-hidden rounded-full"
          >
            <Image
              src={photo.src}
              alt={alt}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 640px) 80vw, 480px"
              className="photo-frame h-full w-full object-cover"
            />
          </div>
          {/* 閉じ方はヒーローの全画面と同じ位置・同じ形にそろえる。 */}
          <button
            ref={closeRef}
            type="button"
            onClick={() => setPhase("closing")}
            aria-label={closeLabel}
            className="absolute right-6 top-6 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-foreground/10 text-foreground outline-accent outline-offset-2 transition-colors hover:bg-foreground/20 focus-visible:outline-2"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </>
  );
}
