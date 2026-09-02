import Link from "next/link";

/**
 * 受賞 1 件分。
 * WorkGridItem と同じく、ロケール解決済みのプレーンなデータだけを受け取る
 * (src/data のアクセサはロケール非依存なので、解決は page.tsx で行う)。
 */
export type AwardListItem = {
  readonly key: string;
  /** 表示用の年月 ("2026.8")。 */
  readonly date: string;
  /** <time datetime> に入れる機械可読な値 ("2026-08")。 */
  readonly dateTime: string;
  readonly prize: string;
  readonly event: string;
  readonly workTitle: string;
  readonly workHref: string;
};

export function AwardList({ items }: { items: readonly AwardListItem[] }) {
  return (
    <ul className="mt-4">
      {items.map((award) => (
        <li key={award.key} className="border-b border-border py-2 text-sm">
          {/* 賞名とイベント名を 1 行に並べると、狭い画面でイベント名が
              任意の位置で折り返してしまう。行を分けて折り返し位置を固定する。 */}
          <div className="flex flex-wrap items-baseline gap-x-3">
            <time
              dateTime={award.dateTime}
              className="w-20 shrink-0 text-muted-foreground"
            >
              {award.date}
            </time>
            {/* 詰まったときに折り返すのは作品名の側。賞名を縮めると
                「最優/秀賞」のように賞の名前が割れて読めなくなる。 */}
            <span className="shrink-0 font-medium">{award.prize}</span>
            {/* 英語の賞名 (Japan Research Institute Award) は日付と並べただけで
                行を埋めてしまう。flex-1 だけだと作品名の箱が幅 0 まで潰れ、
                中の文字が箱からはみ出して 1 文字ずつ割れる。basis を持たせて
                「その幅が残っていなければ行ごと下へ送る」に倒す
                (送られた側は flex-1 で行いっぱいに伸び、右端で揃う)。 */}
            <Link
              href={award.workHref}
              className="min-w-0 flex-1 basis-32 text-right text-accent transition-opacity hover:opacity-70"
            >
              {award.workTitle}
            </Link>
          </div>
          {/* 日付カラム (w-20) + gap-x-3 のぶんだけ字下げして賞名と頭を揃える。 */}
          <p className="mt-0.5 pl-[5.75rem] text-muted-foreground">
            {award.event}
          </p>
        </li>
      ))}
    </ul>
  );
}
