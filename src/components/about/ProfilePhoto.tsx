"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { ImageRef } from "@/data/types";

/** 拡大したときの一辺。ビューポートからはみ出さない範囲で、顔が見える大きさ。 */
const EXPANDED_SIZE = "min(80vw, 80vh, 30rem)";

/** サムネイルと拡大側を結ぶ view transition の名前。ページ内で 1 枚きり。 */
const TRANSITION_NAME = "profile-photo";

/**
 * プロフィール写真。押すと画面中央で拡大する。
 *
 * 演出は Works の一覧タイル -> 詳細 hero と同じ ViewTransition のモーフ。
 * 丸い枠がその場から画面中央へ膨らみ、閉じると同じ道を逆に辿って元の位置に
 * 収まる (globals.css の ::view-transition-group(.morph) を共有しているので、
 * 尺も曲線もブラーも Works と揃う)。幕の出入りは root のクロスフェードが
 * まかなうので、ここで CSS アニメーションは持たない。
 *
 * framer-motion の layoutId ではないのは、このブロックの親が reveal-rise を
 * 持っていて、その CSS の transform が走っている最中の箱をレイアウト投影が
 * 測ってしまい、サムネイルが潰れた形で固定されるため。ViewTransition は
 * 押した瞬間の実際の描画位置を撮るので、この問題を踏まない。
 *
 * 開閉は必ず startTransition の中で行う。素の setState では
 * <ViewTransition> が起動せず、拡大がハードカットになる。
 *
 * 同じ name を名乗る要素が 2 つ同時に居ると名前が衝突してモーフごと飛ぶので、
 * 開いている間はサムネイルを描かない。押しボタンの箱 (h-40 w-40) は残るため
 * レイアウトはずれず、空いた丸も幕の裏なので見えない。
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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // 開いたら閉じるボタンへフォーカスを移し、閉じたら写真へ戻す。
  // キーボードだけで開いた人が、幕の裏のページを辿る羽目にならないように。
  //
  // 戻す側は「一度開いた後か」で絞る。open の初期値も false なので、
  // 素直に書くとページを開いただけで写真へフォーカスが飛び、そこまで
  // スクロールさせられてしまう。
  const hasOpened = useRef(false);
  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      closeRef.current?.focus();
    } else if (hasOpened.current) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") startTransition(() => setOpen(false));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => startTransition(() => setOpen(false));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => startTransition(() => setOpen(true))}
        aria-label={expandLabel}
        className="group block h-40 w-40 cursor-pointer rounded-full outline-accent outline-offset-4 focus-visible:outline-2"
      >
        {/* 丸く抜くのは name を持つ要素自身。ボタン側で overflow-hidden して
            いると、スナップショットは抜かれる前の四角い絵になり、モーフの
            あいだだけ写真が角張って見える。 */}
        {!open && (
          <ViewTransition name={TRANSITION_NAME} share="morph" default="none">
            <div className="photo-frame h-full w-full overflow-hidden rounded-full">
              <Image
                src={photo.src}
                alt={alt}
                width={photo.width}
                height={photo.height}
                priority
                sizes="160px"
                // 押せることの合図。ジャケットのホバーと同じ寄り方に揃える。
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06] motion-reduce:transition-none"
              />
            </div>
          </ViewTransition>
        )}
      </button>

      {open && (
        /* 幕のどこを押しても閉じる。拡大した写真の上も同じで、閉じ方を
           探させない (ボタンは右上にも置いてある)。 */
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm"
        >
          <ViewTransition name={TRANSITION_NAME} share="morph" default="none">
            <div
              style={{ width: EXPANDED_SIZE, height: EXPANDED_SIZE }}
              className="photo-frame overflow-hidden rounded-full"
            >
              <Image
                src={photo.src}
                alt={alt}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 640px) 80vw, 480px"
                className="h-full w-full object-cover"
              />
            </div>
          </ViewTransition>
          {/* 閉じ方はヒーローの全画面と同じ位置・同じ形にそろえる。 */}
          <button
            ref={closeRef}
            type="button"
            onClick={close}
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
