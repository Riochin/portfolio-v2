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

/** "2025-06" -> "2025.6" */
export function formatYearMonth(yearMonth: YearMonth): string {
  const [year, month] = yearMonth.split("-");
  return `${year}.${Number(month)}`;
}

const PRESENT: Record<Locale, string> = { ja: "現在", en: "Present" };

/**
 * 表示は旧サイトの `2024.11 – 2025.12` 形式を踏襲する。
 * `2025年6月` / `Jun 2025` は日英で幅が揃わずタイムラインの目線が崩れるため。
 */
export function formatPeriod(period: Period, locale: Locale): string {
  const start = formatYearMonth(period.start);
  if (period.end === null) return `${start} – ${PRESENT[locale]}`;
  if (period.end === period.start) return start;
  return `${start} – ${formatYearMonth(period.end)}`;
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
