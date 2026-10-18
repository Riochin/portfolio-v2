"use client";

import { TileGrid } from "@/components/tiles/TileGrid";
import { WorkTile } from "./WorkTile";
import { isReturningFromWorkDetail } from "./WorksHistoryBridge";

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

/**
 * Works の一覧。並べ方と動きは TileGrid に任せ、ここは作品のタイルを渡すだけ。
 * 詳細ページから戻ってきた回かどうかは WorksHistoryBridge が知っている。
 */
export function WorkGrid({
  sectionKey,
  items,
  moreLabel,
  lessLabel,
  priorityCount = 0,
}: {
  sectionKey: string;
  items: readonly WorkGridItem[];
  moreLabel: string;
  lessLabel: string;
  /** TileGrid の priorityCount を参照。 */
  priorityCount?: number;
}) {
  return (
    <TileGrid
      sectionKey={sectionKey}
      items={items}
      getKey={(work) => work.slug}
      renderTile={(work, { priority }) => (
        <WorkTile work={work} priority={priority} />
      )}
      moreLabel={moreLabel}
      lessLabel={lessLabel}
      priorityCount={priorityCount}
      isReturning={isReturningFromWorkDetail}
    />
  );
}
