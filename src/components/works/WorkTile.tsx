"use client";

import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { WorkGridItem } from "./WorkGrid";
import { workImageTransitionName } from "./workImageTransition";

/**
 * 作品のタイル 1 枚。Works の一覧 (WorkGrid) とトップの Featured works が
 * 同じものを使う。親の li に group を付けておくと、ホバーで写真が寄り
 * タイトルがアクセント色になる。
 */
export function WorkTile({
  work,
  priority = false,
}: {
  work: WorkGridItem;
  /** ファーストビューに入るタイルだけ true (WorkGrid の priorityCount を参照) */
  priority?: boolean;
}) {
  return (
    <Link href={work.href}>
      {/* 詳細ページの hero と同じ name を付けて、クリック時に画像がそのまま
          拡大するモーフにする。戻るときは同じモーフが逆再生される
          (ブラウザの戻るボタンも WorksHistoryBridge が同じ経路に乗せる)。 */}
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
              priority={priority}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
        </div>
      </ViewTransition>

      <p className="mt-2.5 font-medium group-hover:text-accent">
        {work.title}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{work.period}</p>
      <p className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        {work.stack.map((label) => (
          <span key={label} className="rounded-xl border border-border px-2 py-0.5">
            {label}
          </span>
        ))}
      </p>
    </Link>
  );
}
