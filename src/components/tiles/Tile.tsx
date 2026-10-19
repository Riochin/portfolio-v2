"use client";

import { ViewTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ClampedTitle } from "@/components/tiles/ClampedTitle";

/** 一覧 (2〜3 列) に並べるときの sizes。 */
const SIZES_GRID = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw";
/** トップの compact (2 列〜xl で 4 列) に並べるときの sizes。 */
const SIZES_COMPACT = "(max-width: 1280px) 50vw, 25vw";

/**
 * 写真を敷いたタイル 1 枚。WorkTile (作品) と OutputTile (登壇・記事) が
 * 中身を詰めて使い、トップと各一覧ページで同じ見た目・同じ動きにする。
 * 親の li に group を付けておくと、ホバーで写真が寄りタイトルがアクセント色になる。
 *
 * 写真は transitionName の ViewTransition で包む。別のページに同じ名前の
 * 要素があれば、遷移のときに写真がそちらの位置と大きさへ滑って広がる
 * (トップ -> 一覧、一覧 -> 作品の詳細)。名前が揃っていれば効くので、
 * 相手がこのコンポーネントである必要はない。
 */
export function Tile({
  href,
  external = false,
  transitionName,
  image,
  aspectClass = "aspect-[16/9]",
  title,
  srLabel,
  meta,
  children,
  compact = false,
  priority = false,
}: {
  href: string;
  /** 外部サイトへのリンク。別タブで開き、タイトルの後ろに外部リンクの印を付ける。 */
  external?: boolean;
  transitionName: string;
  image?: { readonly src: string; readonly alt: string };
  /** 写真の枠の縦横比 (Tailwind のクラス名まるごと)。 */
  aspectClass?: string;
  title: string;
  /** 画面には出さず、読み上げだけに足す補足 (外部記事の出典など)。 */
  srLabel?: string;
  /** タイトルの下の 1 行 (期間や公開日)。 */
  meta?: ReactNode;
  /** meta の下に足すもの (作品の技術チップ)。compact では出さない。 */
  children?: ReactNode;
  /**
   * トップ用。4 件を 1 段に詰めるので、写真とタイトルと meta だけを残し、
   * 文字も一段小さくする。タイトルは外部リンクの印まで含めて 3 行で切る
   * (ClampedTitle) ── 長い登壇タイトルで行の高さがばらつくのを防ぐ。
   * 表紙にタイトルが載っているので切っても困らない。
   */
  compact?: boolean;
  /** ファーストビューに入るタイルだけ true (TileGrid の priorityCount を参照) */
  priority?: boolean;
}) {
  const externalIcon = external && (
    <ExternalLink
      size={compact ? 13 : 14}
      className="ml-1 inline align-[-0.125em] opacity-60"
    />
  );

  const body = (
    <>
      <ViewTransition name={transitionName} share="morph" default="none">
        <div
          className={`photo-frame relative ${aspectClass} overflow-hidden rounded-xl bg-gradient-to-br from-accent/25 to-accent/5`}
        >
          {image && (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={compact ? SIZES_COMPACT : SIZES_GRID}
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
        </div>
      </ViewTransition>

      {compact ? (
        <ClampedTitle
          title={title}
          lines={3}
          className="mt-2 line-clamp-3 text-sm font-medium group-hover:text-accent"
          srLabel={srLabel}
          trailing={externalIcon}
        />
      ) : (
        <p className="mt-2.5 font-medium group-hover:text-accent">
          {title}
          {srLabel && <span className="sr-only">（{srLabel}）</span>}
          {externalIcon}
        </p>
      )}
      {meta && (
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {meta}
        </p>
      )}
      {!compact && children}
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <Link href={href}>{body}</Link>
  );
}
