/**
 * 日付だけの値 ("2025-06-05")。SpeakerDeck の発表日がこの形で来る。
 * Zenn / Qiita は時刻まで持つ ISO 文字列。
 */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * publishedAt を "2026.09.03" にする。/output の一覧とトップの最近の記事が使う。
 * 書式は lib/date.ts の formatYearMonthDay と同じ (サイト全体でドット区切り)。
 *
 * 日付だけのものは Date を通さず、そのまま組み替える。
 * new Date("2025-06-05") は UTC 深夜と解釈されるので、getDate() で
 * 読み直すと UTC より西の環境で 1 日前になってしまう
 * (OutputGrid は SSR されてから hydrate されるので、
 *  サーバーとブラウザで時間帯が違うと表示がずれる)。
 */
export function formatPublishedAt(value: string) {
  const parts = value.match(DATE_ONLY);
  if (parts) {
    const [, year, month, day] = parts;
    return `${year}.${month}.${day}`;
  }
  const d = new Date(value);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
