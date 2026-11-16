import type { Locale } from "@/lib/i18n/config";

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Month =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12";

export type Year = `20${Digit}${Digit}`;

/**
 * "2025-06" 形式。ゼロ埋めなので単純な文字列比較で時系列に並ぶ。
 *
 * 旧サイトは `date: '2025.3'` / `'2024.11 - 2025.12'` / `'2024.4 - Present'` を
 * 同じ string フィールドに詰めていたため、並び替えも「継続中か」の判定もできなかった。
 */
export type YearMonth = `${Year}-${Month}`;

/** 01-31。存在しない日 (2 月 31 日など) までは型では防げないので isYearMonthDay() で確かめる。 */
export type Day =
  | `0${Exclude<Digit, "0">}`
  | `1${Digit}`
  | `2${Digit}`
  | "30"
  | "31";

/**
 * "2026-09-03" 形式。記事の公開日に使う。
 *
 * 作品や経歴は月単位 (YearMonth) で足りるが、記事は同じ月に複数出るので日まで要る。
 * ゼロ埋めなので YearMonth と同じく文字列比較で並ぶ。この形にしておくと
 * OutputGrid の DATE_ONLY 分岐にそのまま乗り、new Date() の UTC 深夜解釈による
 * SSR / hydrate のズレを踏まない。
 */
export type YearMonthDay = `${YearMonth}-${Day}`;

/**
 * 期間。`end: null` は継続中を意味する。
 * optional ではなく必須にすることで、データを書くたびに「継続中か」を明示させる。
 */
export type Period = {
  readonly start: YearMonth;
  readonly end: YearMonth | null;
};

/** 継続中は遠い未来として扱い、新しい順で先頭に来るようにする。 */
export const periodEndKey = (period: Period): string => period.end ?? "9999-99";

/** 新しい順。終了が同じなら開始が新しい方を先に。 */
export function comparePeriodDesc(a: Period, b: Period): number {
  return (
    periodEndKey(b).localeCompare(periodEndKey(a)) ||
    b.start.localeCompare(a.start)
  );
}

/**
 * 開始が新しい順。開始が同じなら終了が新しい方を先に。
 *
 * comparePeriodDesc と違って開始日が主キー。開始年で見出しを立てる並びでは
 * 見出しと順序の基準が一致していないと、年をまたぐ項目が自分の年の塊から
 * はみ出して見えるため。
 */
export function compareStartDesc(a: Period, b: Period): number {
  return (
    b.start.localeCompare(a.start) ||
    periodEndKey(b).localeCompare(periodEndKey(a))
  );
}

/** "2025-06" -> "2025" */
export const yearOf = (yearMonth: YearMonth): Year =>
  yearMonth.slice(0, 4) as Year;

/**
 * "2025-06" -> "2025.06"
 *
 * 日付の表示はサイト全体でドット区切り・ゼロ埋めに揃える (formatYearMonthDay、
 * lib/output/format.ts も同じ)。月までと日までが同じ区切りで読め、桁も
 * 揃うので、トップのリストのように日付を列に並べても頭がずれない。
 */
export function formatYearMonth(yearMonth: YearMonth): string {
  return yearMonth.replace("-", ".");
}

/**
 * "2026-09-03" -> "2026.09.03"
 *
 * new Date() を通さずに組み替える。`new Date("2026-09-03")` は UTC 深夜と
 * 解釈されるので、getDate() で読み直すと UTC より西の環境で 1 日前になる。
 * lib/output/format.ts が同じ理由で同じことをしている。
 */
export function formatYearMonthDay(value: YearMonthDay): string {
  return value.replaceAll("-", ".");
}

const PRESENT: Record<Locale, string> = { ja: "現在", en: "Present" };

/**
 * 表示は旧サイトの `2024.11 – 2025.12` 形式を踏襲する (月はゼロ埋め)。
 * `2025年6月` / `Jun 2025` は日英で幅が揃わずタイムラインの目線が崩れるため。
 */
export function formatPeriod(period: Period, locale: Locale): string {
  const start = formatYearMonth(period.start);
  if (period.end === null) return `${start} – ${PRESENT[locale]}`;
  if (period.end === period.start) return start;
  return `${start} – ${formatYearMonth(period.end)}`;
}

/** "2026-07-04" -> "2026-07" */
export const yearMonthOf = (value: YearMonthDay): YearMonth =>
  value.slice(0, 7) as YearMonth;

/** 日単位の期間を、月単位の Period に丸める (並び替えと一覧の表示用)。 */
export function toMonthPeriod(
  start: YearMonthDay,
  end: YearMonthDay | null,
): Period {
  return { start: yearMonthOf(start), end: end && yearMonthOf(end) };
}

/** new Date() の文字列解釈を通さずに、UTC の日数に直す。 */
function dayNumber(value: YearMonthDay): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** 両端を含む日数。"2026-08-31" から "2026-09-01" は 2 日。 */
export function daySpan(start: YearMonthDay, end: YearMonthDay): number {
  return dayNumber(end) - dayNumber(start) + 1;
}

/**
 * 期間の長さの目安。ハッカソンは 2 日から 2 か月まであるので、
 * 1 週間に満たなければ日数、2 か月未満は週、それ以上は月で丸める。
 */
export function formatDuration(days: number, locale: Locale): string {
  if (days <= 6) {
    return locale === "ja" ? `${days}日間` : `${days} day${days === 1 ? "" : "s"}`;
  }
  if (days < 60) {
    const weeks = Math.round(days / 7);
    return locale === "ja"
      ? `約${weeks}週間`
      : `about ${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const months = Math.round(days / 30);
  return locale === "ja" ? `約${months}か月` : `about ${months} months`;
}

/**
 * "2026-07-04" ～ "2026-08-23" -> "2026.07.04 – 08.23（約7週間）"
 *
 * 区切りとゼロ埋めは formatYearMonthDay と同じ。終わりが同じ年なら年を省く。
 * 終わりが null (今も開発中) なら長さは出さない。
 */
export function formatDayPeriod(
  start: YearMonthDay,
  end: YearMonthDay | null,
  locale: Locale,
): string {
  const from = formatYearMonthDay(start);
  if (end === null) return `${from} – ${PRESENT[locale]}`;
  const duration = formatDuration(daySpan(start, end), locale);
  const withDuration = (range: string) =>
    locale === "ja" ? `${range}（${duration}）` : `${range} (${duration})`;
  if (end === start) return withDuration(from);
  const to =
    end.slice(0, 4) === start.slice(0, 4)
      ? formatYearMonthDay(end).slice(5)
      : formatYearMonthDay(end);
  return withDuration(`${from} – ${to}`);
}

/**
 * 日本の学年 (4 月始まり)。`start` は入学年月。
 *
 * 「3年」をデータに直書きすると毎年 4 月に静かに古くなるので、入学年月から導く。
 * 会計年度と同じ数え方: 1〜3 月は前年度に属する。
 */
export function academicYear(start: YearMonth, now: Date = new Date()): number {
  const fiscalYear = (year: number, month: number) =>
    month >= 4 ? year : year - 1;
  const [startYear, startMonth] = start.split("-").map(Number);
  return (
    fiscalYear(now.getFullYear(), now.getMonth() + 1) -
    fiscalYear(startYear, startMonth) +
    1
  );
}
