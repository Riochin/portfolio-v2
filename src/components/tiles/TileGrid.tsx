"use client";

import { useRef, useState, type ReactNode } from "react";
import { useCollapseMotion } from "@/lib/useCollapseMotion";

/** 1 件ごとの出現ディレイ。DOM 順 = 左上から右下の順になる。 */
const STAGGER_MS = 60;

/**
 * 折り畳まずに出す件数 (2 列以上)。
 *
 * 5 なのは「もっとみる」をタイルとしてグリッドに並べるから。5 + ボタン = 6 で、
 * 3 列でも 2 列でも最終行に穴があかない。
 */
const PREVIEW_COUNT = 5;

/**
 * 折り畳まずに出す件数 (1 列 = sm 未満)。
 *
 * 1 列だとタイルが画面幅いっぱいで背が高く、5 件並べると「もっとみる」に
 * 届くまで指で何画面も送ることになる。3 + ボタン = 4 で 1 列でも収まる。
 *
 * SSR では画面幅が分からないので、件数そのものは 2 列以上に合わせたまま
 * CSS (max-sm:hidden) で余りを伏せる。JS で幅を見て出し分けると、
 * ハイドレーションの瞬間に 5 件が 3 件へ縮む瞬きが出る。
 */
const MOBILE_PREVIEW_COUNT = 3;

/**
 * 「もっとみる」を開いているかをセクションごとに控えておく場所。
 *
 * 詳細ページ (や自前記事) へ移ると一覧は unmount されるので、useState だけだと
 * 戻ってきたときに畳まれた状態から始まる ── 開いて 7 件目を押した人は、戻ると
 * 自分の押したタイルが消えている (モーフの相手も居ないので画像が飛ぶ先を失う)。
 * WorksHistoryBridge のスクロール位置と同じく、モジュールスコープに置いて
 * クライアント遷移のあいだだけ持たせる。リロードで消えるのも同じで、
 * そのときはモーフも戻り扱いも走らないので辻褄が合う。
 *
 * 書くのは onClick の中だけ = ブラウザ側だけなので、サーバの評価では常に
 * 空のまま。SSR は必ず畳んだ状態を返し、ハイドレーションもずれない。
 */
const expandedBySection = new Map<string, boolean>();

/**
 * Tile を並べる一覧のグリッド。Works (WorkGrid) と Output (OutputGrid) が
 * 中身を渡して使い、出現のずらし方・「もっとみる」の件数と開閉・
 * 先読みの件数をどちらでも同じにする。以前は 2 つが別々に書かれていて、
 * スマホで畳む件数や戻ってきたときの扱いが少しずつずれていた。
 */
export function TileGrid<T>({
  sectionKey,
  items,
  getKey,
  renderTile,
  moreLabel,
  lessLabel,
  priorityCount = 0,
  isReturning,
}: {
  /** 開閉を控えるときの見出し。サイト内のセクションごとに別であればよい。 */
  sectionKey: string;
  items: readonly T[];
  getKey: (item: T) => string;
  renderTile: (item: T, options: { priority: boolean }) => ReactNode;
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
  /**
   * 詳細ページから戻ってきた回か。マウント時に 1 回だけ呼ぶ。
   * Works は WorksHistoryBridge が知っている。渡さなければ常に初回扱い。
   */
  isReturning?: () => boolean;
}) {
  const [expanded, setExpanded] = useState(
    () => expandedBySection.get(sectionKey) ?? false,
  );
  // 畳む側だけ手順を付ける (消えるぶんが薄くなる -> 畳む -> 入ってきたぶんが
  // 降りる)。視点をボタンに固定するのもこの中。
  const buttonRef = useRef<HTMLButtonElement>(null);
  const collapse = useCollapseMotion(buttonRef);
  const toggle = () => {
    if (!expanded) {
      // 開く側は今までどおり。1 件ずつ reveal-rise で出す手応えを残す。
      expandedBySection.set(sectionKey, true);
      setExpanded(true);
      return;
    }
    // 1 列では 3 件しか残らない (4 件目以降は max-sm:hidden で伏せる)。
    // どこから先が消えるかは押した時点の幅で決まる。
    const keepCount = window.matchMedia("(width < 40rem)").matches
      ? MOBILE_PREVIEW_COUNT
      : PREVIEW_COUNT;
    collapse(keepCount, () => {
      expandedBySection.set(sectionKey, false);
      setExpanded(false);
    });
  };

  // 戻ってきたときに出現アニメを止める範囲は「マウントした時点で画面に在った
  // 件数」。開いたまま戻ってきた回は 6 件目以降も最初から在るので、そこも
  // 止めないと、押したタイルが opacity 0 から始まってモーフが切れる。
  const [mountedExpanded] = useState(expanded);

  // 詳細から戻ってきた回かどうかはマウント時に決める。あとから見直すと、
  // 「もっとみる」を押した拍子に画面に出ている分まで再生されてしまう。
  const [returning] = useState(() => isReturning?.() ?? false);

  // 1 列のときだけ畳む件数が違うので、「畳めるか」も幅で変わる
  // (4 件のセクションは 1 列でだけ「もっとみる」が要る)。
  const collapsible = items.length > MOBILE_PREVIEW_COUNT;
  const collapsibleWide = items.length > PREVIEW_COUNT;
  const visible =
    collapsibleWide && !expanded ? items.slice(0, PREVIEW_COUNT) : items;

  // 「もっとみる」で現れたぶんは、その中での順番でずらす。
  // 通し番号のままだと 7 件目が 360ms 待ってから出てきて、押した手応えが鈍る。
  const revealFrom = expanded ? PREVIEW_COUNT : 0;

  // 戻ってきたときは、最初から画面に在った分の出現アニメを流さない。
  // 流すとモーフの相手のタイルが opacity 0 から始まり、詳細の画像が
  // 「行き先で消えている」ことになって、拡大が縮小に見えず一度消える。
  // 「もっとみる」で後から現れる分は、押した手応えとして今までどおり出す。
  const revealClass = (index: number) =>
    returning && index < (mountedExpanded ? items.length : PREVIEW_COUNT)
      ? ""
      : "reveal-rise";

  // 畳んでいるあいだ、1 列では 4 件目以降を伏せる。
  const hiddenWhenNarrow = (index: number) =>
    !expanded && index >= MOBILE_PREVIEW_COUNT ? "max-sm:hidden" : "";

  return (
    <ul className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((item, index) => (
        <li
          key={getKey(item)}
          className={`group ${revealClass(index)} ${hiddenWhenNarrow(index)}`}
          style={
            {
              "--reveal-delay": `${Math.max(0, index - revealFrom) * STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        >
          {renderTile(item, { priority: index < priorityCount })}
        </li>
      ))}

      {/* 「もっとみる」もタイルとしてグリッドに並べる。1 列 (スマホ) では
            タイルと同じ横幅のボタンに、2 列以上では h-full で行の高さまで伸びて
            タイルと同じ大きさの面になる。 */}
      {collapsible && (
        <li
          className={`${returning ? "" : "reveal-rise"} ${collapsibleWide ? "" : "sm:hidden"}`}
          style={
            {
              "--reveal-delay": `${Math.max(0, visible.length - revealFrom) * STAGGER_MS}ms`,
              // 1 列では前に並ぶ枚数が 1 段少ないので、待つ長さもその分短い
              // (globals.css の reveal-rise が幅で読み分ける)。
              "--reveal-delay-sm": `${Math.max(0, (expanded ? visible.length : MOBILE_PREVIEW_COUNT) - revealFrom) * STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            className="flex h-full w-full items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {expanded ? (
              lessLabel
            ) : (
              <>
                {/* 残り件数も畳む枚数で変わる。幅は CSS でしか分からないので
                    両方書いて出し分ける。 */}
                <span className="sm:hidden">
                  {moreLabel} ({items.length - MOBILE_PREVIEW_COUNT})
                </span>
                {collapsibleWide && (
                  <span className="hidden sm:inline">
                    {moreLabel} ({items.length - PREVIEW_COUNT})
                  </span>
                )}
              </>
            )}
          </button>
        </li>
      )}
    </ul>
  );
}
