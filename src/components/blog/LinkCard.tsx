import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { LinkCard as LinkCardData } from "@/lib/articles/link-card";

/**
 * 単独行の URL の代わりに置くカード。中身は rehypeLinkCard がビルド時に
 * 解決したものなので、ここでは取りに行かないしクライアントに JS も送らない。
 *
 * サムネイルは next/image ではなく素の <img> で出す。OGP 画像のホストは
 * 他所が吐いた URL 次第で何が来るか保証がなく、next/image に渡すには
 * next.config.ts の remotePatterns にホストが要る (未登録だと配信時に 400)。
 * /output の一覧は許可リストを持てたが、本文のリンクは行き先を絞れない。
 * 最適化は諦めて、どのドメインでも出るほうを採る。
 *
 * 寸法は画像から取らず枠の側で決めているので、読み込みの前後でレイアウトは
 * 動かない (= CLS が出ない)。
 *
 * 中身を div ではなく span で組むのは、カードが万一インラインの文脈に
 * 置かれても DOM がねじれないようにするため。flex も line-clamp も
 * display を自分で決めるので、span でも見た目は変わらない。
 */
export function LinkCard({
  href,
  title,
  description,
  image,
  siteName,
  internal,
}: LinkCardData) {
  const inner = (
    <>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
        <span className="line-clamp-2 font-medium group-hover:text-accent">
          {title}
        </span>
        {description && (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </span>
        )}
        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{siteName}</span>
          {/* 外部への遷移だけ印を付ける。本文中のインラインリンクと同じ扱い。 */}
          {!internal && <ExternalLink size={12} className="shrink-0 opacity-60" />}
        </span>
      </span>

      {image && (
        // 枠は画像と無関係に大きさを持ち、画像は絶対配置でその中を埋める。
        // min-h があるので、タイトルだけの短いカードでも細い帯にならない。
        // 地の色は Works / Output のタイルと同じ ── 読み込み前や
        // 透過 PNG でも枠が空白にならないように敷く。
        <span className="relative min-h-[104px] w-[36%] max-w-[200px] shrink-0 self-stretch bg-gradient-to-br from-accent/25 to-accent/5">
          {/* eslint-disable-next-line @next/next/no-img-element -- 行き先のホストを絞れないので next/image に渡せない */}
          <img
            src={image}
            // タイトルが隣にあるので、読み上げに足せる情報がない。
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </span>
      )}
    </>
  );

  const className =
    "link-card group flex overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent";

  // サイト内はクライアント遷移、外部は別タブ。MarkdownLink の分岐と揃える。
  return internal ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {inner}
    </a>
  );
}
