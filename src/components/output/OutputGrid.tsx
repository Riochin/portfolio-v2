"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { OutputItem } from "@/lib/output/types";

/**
 * 画面には出さない。サムネイルが OGP なので見れば出典は分かるが、
 * 読み上げには残したいのでリンクのアクセシブルネームに混ぜる。
 */
const SOURCE_LABELS: Record<OutputItem["source"], string> = {
  speakerdeck: "Speaker Deck",
  zenn: "Zenn",
  qiita: "Qiita",
};

/** 1 件ごとの出現ディレイ。DOM 順 = 左上から右下の順になる。WorkGrid と揃える。 */
const STAGGER_MS = 60;

/**
 * 折り畳まずに出す件数。
 *
 * 5 なのは「もっとみる」をタイルとしてグリッドに並べるから。5 + ボタン = 6 で、
 * 3 列でも 2 列でも最終行に穴があかない。WorkGrid と同じ理由・同じ値。
 */
const PREVIEW_COUNT = 5;

/**
 * 日付だけの値 ("2025-06-05")。SpeakerDeck の発表日がこの形で来る。
 * Zenn / Qiita は時刻まで持つ ISO 文字列。
 */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatDate(value: string) {
  // 日付だけのものは Date を通さず、そのまま組み替える。
  // new Date("2025-06-05") は UTC 深夜と解釈されるので、getDate() で
  // 読み直すと UTC より西の環境で 1 日前になってしまう
  // (このコンポーネントは SSR されてから hydrate されるので、
  //  サーバーとブラウザで時間帯が違うと表示がずれる)。
  const parts = value.match(DATE_ONLY);
  if (parts) {
    const [, year, month, day] = parts;
    return `${year}/${month}/${day}`;
  }
  const d = new Date(value);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Works の一覧タイルと同じ見た目で外部のアウトプットを並べる。
 * 遷移先が外部サイトなので、Works と違って view transition は張らない。
 */
export function OutputGrid({
  items,
  emptyLabel,
  moreLabel,
  lessLabel,
}: {
  items: readonly OutputItem[];
  emptyLabel: string;
  moreLabel: string;
  lessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyLabel}</p>;
  }

  const collapsible = items.length > PREVIEW_COUNT;
  const visible =
    collapsible && !expanded ? items.slice(0, PREVIEW_COUNT) : items;

  // 「もっとみる」で現れたぶんは、その中での順番でずらす。
  // 通し番号のままだと 7 件目が 360ms 待ってから出てきて、押した手応えが鈍る。
  const revealFrom = expanded ? PREVIEW_COUNT : 0;

  return (
    <ul className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((item, index) => (
        <li
          key={item.url}
          className="group reveal-rise"
          style={
            {
              "--reveal-delay": `${Math.max(0, index - revealFrom) * STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        >
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {/* Works のタイルは 16:10 だが、ここだけ 16:9。
                敷くのが自前の写真ではなく他所の OGP (Speaker Deck は 16:9、
                Zenn / Qiita は 1200x630) で、16:10 まで詰めると object-cover が
                左右を削って画像内の見出しが切れてしまうため。 */}
            <div className="photo-frame relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-accent/25 to-accent/5">
              {item.thumbnail && (
                <Image
                  src={item.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>

            <p className="mt-2.5 font-medium group-hover:text-accent">
              {item.title}
              <span className="sr-only">（{SOURCE_LABELS[item.source]}）</span>
              <ExternalLink
                size={14}
                className="ml-1 inline-block align-baseline opacity-60"
              />
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <time dateTime={item.publishedAt}>
                {formatDate(item.publishedAt)}
              </time>
            </p>
          </a>
        </li>
      ))}

      {/* 「もっとみる」もタイルとしてグリッドに並べる。1 列 (スマホ) では
          記事と同じ横幅のボタンに、2 列以上では h-full で行の高さまで伸びて
          記事タイルと同じ大きさの面になる。WorkGrid と同じ作り。 */}
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
