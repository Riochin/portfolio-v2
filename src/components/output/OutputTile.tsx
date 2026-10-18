import { Tile } from "@/components/tiles/Tile";
import { formatPublishedAt } from "@/lib/output/format";
import { outputImageTransitionName } from "@/lib/output/transition";
import type { OutputItem } from "@/lib/output/types";

/**
 * 画面には出さない。サムネイルが OGP なので見れば出典は分かるが、
 * 読み上げには残したいのでリンクのアクセシブルネームに混ぜる。
 */
const SOURCE_LABELS: Record<OutputItem["source"], string> = {
  speakerdeck: "Speaker Deck",
  zenn: "Zenn",
  qiita: "Qiita",
  /** 自前記事は出典を名乗らない。このサイト自身なので読み上げても情報が増えない。 */
  self: "",
};

/**
 * ソースごとのサムネイル枠の縦横比。
 *
 * 枠と実物の比がずれると object-cover が差分を削る。全ソース 16:9 に揃えて
 * いたときは Zenn / Qiita の OGP (1200x630 = 1.905) が枠 (1.778) より横長で、
 * 左右 40px ずつ落ちて OGP 内の白いカードの縁が切れていた。
 * 実物どおりの比にしておけば object-cover は何も削らない。
 *
 * 比を分けても行の高さは揃う。Talks は Speaker Deck だけ、Articles は
 * Zenn と Qiita だけで、同じグリッドに別の比が混ざらないため。
 *
 * 値はクラス名まるごとで持つ。Tailwind はソースを文字列として走査するので、
 * `aspect-[${ratio}]` のように組み立てるとクラスが生成されない。
 */
const ASPECT_CLASS: Record<OutputItem["source"], string> = {
  /** スライド 1 枚目のプレビュー (640x360)。 */
  speakerdeck: "aspect-video",
  zenn: "aspect-[1200/630]",
  qiita: "aspect-[1200/630]",
  /** 自前記事のサムネイルは next/og で焼いた OG 画像なので Zenn / Qiita と同寸。 */
  self: "aspect-[1200/630]",
};

/**
 * 登壇・記事のタイル 1 枚。/output の一覧 (OutputGrid) とトップの
 * Recent talks が同じものを使う。見た目と動きは Tile に任せる (WorkTile と同じ)。
 *
 * 写真の name は出どころの URL から作るので、トップから「すべての登壇資料を
 * 見る」で /output に移ると、同じタイルの位置へサムネイルが滑って広がる。
 */
export function OutputTile({
  item,
  priority = false,
  compact = false,
}: {
  item: OutputItem;
  priority?: boolean;
  compact?: boolean;
}) {
  // 自前記事だけ遷移先がサイト内。別タブに飛ばさず、外部リンクの印も出さない。
  const external = item.source !== "self";
  return (
    <Tile
      href={item.url}
      external={external}
      transitionName={outputImageTransitionName(item.url)}
      image={item.thumbnail ? { src: item.thumbnail, alt: "" } : undefined}
      aspectClass={ASPECT_CLASS[item.source]}
      title={item.title}
      srLabel={external ? SOURCE_LABELS[item.source] : undefined}
      meta={
        <time dateTime={item.publishedAt}>
          {formatPublishedAt(item.publishedAt)}
        </time>
      }
      compact={compact}
      priority={priority}
    />
  );
}
