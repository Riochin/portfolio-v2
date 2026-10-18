import { Tile } from "@/components/tiles/Tile";
import type { WorkGridItem } from "./WorkGrid";
import { workImageTransitionName } from "./workImageTransition";

/**
 * 作品のタイル 1 枚。Works の一覧 (WorkGrid) とトップの Featured works が
 * 同じものを使う。見た目と動きは Tile に任せ、ここは作品のデータを詰めるだけ。
 *
 * 写真には詳細ページの hero と同じ name を付けるので、クリック時に画像が
 * そのまま拡大するモーフになる。戻るときは同じモーフが逆再生される
 * (ブラウザの戻るボタンも WorksHistoryBridge が同じ経路に乗せる)。
 */
export function WorkTile({
  work,
  priority = false,
  compact = false,
}: {
  work: WorkGridItem;
  /** ファーストビューに入るタイルだけ true (WorkGrid の priorityCount を参照) */
  priority?: boolean;
  /** トップの Featured works 用。期間と技術スタックを出さない (Tile の compact)。 */
  compact?: boolean;
}) {
  return (
    <Tile
      href={work.href}
      transitionName={workImageTransitionName(work.slug)}
      image={work.image}
      title={work.title}
      meta={compact ? undefined : work.period}
      compact={compact}
      priority={priority}
    >
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
    </Tile>
  );
}
