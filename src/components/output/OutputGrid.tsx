"use client";

import { TileGrid } from "@/components/tiles/TileGrid";
import type { OutputItem } from "@/lib/output/types";
import { OutputTile } from "./OutputTile";

/**
 * /output の一覧。並べ方と動きは TileGrid に任せ (Works と同じ)、
 * ここは登壇・記事のタイルを渡すだけ。
 */
export function OutputGrid({
  sectionKey,
  items,
  emptyLabel,
  moreLabel,
  lessLabel,
  priorityCount = 0,
}: {
  /** 開閉を控えるときの見出し。サイト内のセクションごとに別であればよい。 */
  sectionKey: string;
  items: readonly OutputItem[];
  emptyLabel: string;
  moreLabel: string;
  lessLabel: string;
  /** TileGrid の priorityCount を参照。 */
  priorityCount?: number;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <TileGrid
      sectionKey={sectionKey}
      items={items}
      getKey={(item) => item.url}
      renderTile={(item, { priority }) => (
        <OutputTile item={item} priority={priority} />
      )}
      moreLabel={moreLabel}
      lessLabel={lessLabel}
      priorityCount={priorityCount}
    />
  );
}
