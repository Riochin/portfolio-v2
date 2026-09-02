"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { isReturningFromWorkDetail } from "./WorksHistoryBridge";
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
 * 詳細ページへ移ると一覧は unmount されるので、useState だけだと戻ってきた
 * ときに畳まれた状態から始まる ── 開いて 7 件目を押した人は、戻ると自分の
 * 押したタイルが消えている (モーフの相手も居ないので画像が飛ぶ先を失う)。
 * WorksHistoryBridge のスクロール位置と同じく、モジュールスコープに置いて
 * クライアント遷移のあいだだけ持たせる。リロードで消えるのも同じで、
 * そのときはモーフも戻り扱いも走らないので辻褄が合う。
 *
 * 書くのは onClick の中だけ = ブラウザ側だけなので、サーバの評価では常に
 * 空のまま。SSR は必ず畳んだ状態を返し、ハイドレーションもずれない。
 */
const expandedBySection = new Map<string, boolean>();

export function WorkGrid({
  sectionKey,
  items,
  moreLabel,
  lessLabel,
  priorityCount = 0,
}: {
  /** 開閉を控えるときの見出し。ページ内のセクションごとに別であればよい。 */
  sectionKey: string;
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
  const [expanded, setExpanded] = useState(
    () => expandedBySection.get(sectionKey) ?? false,
  );
  const toggle = () => {
    expandedBySection.set(sectionKey, !expanded);
    setExpanded(!expanded);
  };

  // 戻ってきたときに出現アニメを止める範囲は「マウントした時点で画面に在った
  // 件数」。開いたまま戻ってきた回は 6 件目以降も最初から在るので、そこも
  // 止めないと、押したタイルが opacity 0 から始まってモーフが切れる。
  const [mountedExpanded] = useState(expanded);

  // 詳細から戻ってきた回かどうかはマウント時に決める。あとから見直すと、
  // 「もっとみる」を押した拍子に画面に出ている分まで再生されてしまう。
  const [returning] = useState(isReturningFromWorkDetail);

  // 1 列のときだけ畳む件数が違うので、「畳めるか」も幅で変わる
  // (作品 4 件のセクションは 1 列でだけ「もっとみる」が要る)。
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
      {visible.map((work, index) => (
        <li
          key={work.slug}
          className={`group ${revealClass(index)} ${hiddenWhenNarrow(index)}`}
          style={
            {
              "--reveal-delay": `${Math.max(0, index - revealFrom) * STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        >
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
