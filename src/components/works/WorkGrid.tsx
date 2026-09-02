"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { workImageTransitionName } from "./workImageTransition";

/**
 * 一覧タイル 1 件分。
 * サーバー側でロケール解決済みのプレーンなデータだけを受け取る
 * (src/data のアクセサはロケール非依存なので、解決は page.tsx で行う)。
 */
export type WorkGridItem = {
  readonly slug: string;
  readonly href: string;
  readonly title: string;
  readonly period: string;
  readonly image?: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
    readonly alt: string;
  };
  readonly stack: readonly string[];
};

/** 1 件ごとの出現ディレイ。DOM 順 = 左上から右下の順になる。 */
const STAGGER_MS = 60;

/**
 * 折り畳まずに出す件数。
 *
 * 5 なのは「もっとみる」をタイルとしてグリッドに並べるから。5 + ボタン = 6 で、
 * 3 列でも 2 列でも最終行に穴があかない。
 */
const PREVIEW_COUNT = 5;

export function WorkGrid({
  items,
  moreLabel,
  lessLabel,
  priorityCount = 0,
}: {
  items: readonly WorkGridItem[];
  moreLabel: string;
  lessLabel: string;
  /**
   * 先頭から何件を先読みするか。ファーストビューに入る行のぶんだけ渡す
   * (最大 3 列なので 3。2 つ目以降のセクションは画面外なので 0 のまま)。
   *
   * next/image は既定で loading="lazy" になる。画面に映っているタイルまで
   * 遅延にすると、プリロードスキャナが拾わないぶん「レイアウトが決まってから
   * 取りに行く」順序になり、reveal-rise で先に出たグラデーションの枠へ
   * 写真が後乗せされる ── リロードのたびに画像が入れ替わって見える原因。
   */
  priorityCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const collapsible = items.length > PREVIEW_COUNT;
  const visible =
    collapsible && !expanded ? items.slice(0, PREVIEW_COUNT) : items;

  // 「もっとみる」で現れたぶんは、その中での順番でずらす。
  // 通し番号のままだと 7 件目が 360ms 待ってから出てきて、押した手応えが鈍る。
  const revealFrom = expanded ? PREVIEW_COUNT : 0;

  return (
    <ul className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((work, index) => (
        <li
          key={work.slug}
          className="group reveal-rise"
          style={
            {
              "--reveal-delay": `${Math.max(0, index - revealFrom) * STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        >
          <Link href={work.href}>
            {/* 詳細ページの hero と同じ name を付けて、クリック時に画像がそのまま
                拡大するモーフにする。戻るときは同じモーフが自動で逆再生される
                (ブラウザの戻るボタンでも同様)。 */}
            <ViewTransition
              name={workImageTransitionName(work.slug)}
              share="morph"
              default="none"
            >
              <div className="photo-frame relative aspect-[16/9] overflow-hidden rounded-xl bg-gradient-to-br from-accent/25 to-accent/5">
                {work.image && (
                  <Image
                    src={work.image.src}
                    alt={work.image.alt}
                    width={work.image.width}
                    height={work.image.height}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    priority={index < priorityCount}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
            </ViewTransition>

            <p className="mt-2.5 font-medium group-hover:text-accent">
              {work.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {work.period}
            </p>
            <p className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              {work.stack.map((label) => (
                <span
                  key={label}
                  className="rounded-xl border border-border px-2 py-0.5"
                >
                  {label}
                </span>
              ))}
            </p>
          </Link>
        </li>
      ))}

      {/* 「もっとみる」もタイルとしてグリッドに並べる。1 列 (スマホ) では
            作品と同じ横幅のボタンに、2 列以上では h-full で行の高さまで伸びて
            作品タイルと同じ大きさの面になる。 */}
      {collapsible && (
        <li
          className="reveal-rise"
          style={
            {
              "--reveal-delay": `${Math.max(0, visible.length - revealFrom) * STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        >
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className="flex h-full w-full items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {expanded
              ? lessLabel
              : `${moreLabel} (${items.length - PREVIEW_COUNT})`}
          </button>
        </li>
      )}
    </ul>
  );
}
