import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type PagerLink = {
  readonly href: string;
  readonly label: string;
};

/* 3 つとも同じ「押せる面」で作る。枠の形と hover は「もっとみる」
   (WorkGrid / OutputGrid) から借りていて、サイト内で既に押される面として
   通っている形をそのまま使う ── 新しい語彙を増やさないため。

   面を揃えたことで画面幅による出し分けが要らなくなった。以前は狭い画面で
   タイトルを伏せて矢印だけの丸ボタンにしていたが、前後を上段に 2 つ並べる
   形にすれば、狭くてもタイトルを出したまま 1 行に収まる (溢れは truncate)。 */
const NEIGHBOR_LINK =
  "flex min-w-0 items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-muted-foreground transition-colors hover:border-accent hover:text-accent";

/* 中央の「一覧へ」。ページャで一番押されるべき導線なので、下段に幅いっぱいで
   置いて前後より強く見せる (font-medium と text-foreground もその差)。

   呼び出し側が <a> に付ける。枠と hover の当たりをリンク自身に持たせたいので、
   DetailPager 側で包まずクラスだけを渡す。 */
export const PAGER_BACK_LINK =
  "block w-full rounded-xl border border-border px-5 py-2.5 text-center font-medium text-foreground transition-colors hover:border-accent hover:text-accent";

/**
 * 詳細ページの末尾に置く「次の一手」。前後のページと、一覧へ戻る導線。
 *
 * ページ上部の「戻る」とは役割が違う。上は読み始める前の離脱口で、こちらは
 * 読み終えたあとの続き。文言も呼び出し側で言い分けている。
 *
 * label をロケール解決済みのプレーンな文字列で受けるのは、Works と記事で
 * タイトルの型が揃わないため ── Work.title は Localized<string> だが、
 * Article.title は素の string (記事だけ日本語単言語。lib/articles/types.ts)。
 * データ層はロケール非依存に保つ約束なので、解決は呼び出し側の Server
 * Component で済ませ、ここには結果だけを渡す。
 *
 * 中央の back を slot で受けるのも同じ理由の裏返しで、Works だけは
 * BackToWorksLink (Client Component) を使いたい。SiteChrome が MobileMenu へ
 * LanguageSwitcher を渡しているのと同じ形。
 */
export function DetailPager({
  prev,
  next,
  back,
  ariaLabel,
}: {
  prev?: PagerLink;
  next?: PagerLink;
  back: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="mt-16 text-sm"
    >
      <div className="flex flex-col gap-3">
        {(prev || next) && (
          // 列を col-start-* で固定する。自動配置に任せると、前が無いページ
          // (一覧の先頭) で次が 1 列目に来て、矢印が右を向いたまま左に座る。
          // 固定しておけば欠けた側が空くだけで、左右の意味がずれない。
          <div className="grid grid-cols-2 gap-3">
            {prev && (
              <Link
                href={prev.href}
                className={`col-start-1 ${NEIGHBOR_LINK}`}
              >
                <ArrowLeft size={16} className="shrink-0" />
                <span className="truncate">{prev.label}</span>
              </Link>
            )}
            {next && (
              <Link
                href={next.href}
                className={`col-start-2 justify-end ${NEIGHBOR_LINK}`}
              >
                <span className="truncate">{next.label}</span>
                <ArrowRight size={16} className="shrink-0" />
              </Link>
            )}
          </div>
        )}
        {back}
      </div>
    </nav>
  );
}
