import type { Work } from "@/data/types";
import { formatDayPeriod, formatPeriod } from "@/lib/date";
import type { Locale } from "@/lib/i18n/config";
import { DICT } from "@/lib/i18n/dictionary";
import type { Translator } from "@/lib/i18n/types";

/**
 * 詳細ページのタイトル下に ` · ` でつなぐ 1 行の中身。
 *
 * ハッカソン: イベント名 · 5人チーム · 担当 · 2026.07.04 – 08.23（約7週間）
 * 個人開発:   個人開発 · 2026.03 – 現在
 *
 * 詳細ページと Markdown 出力が同じ並びになるよう、ここで組み立てる。
 */
export function workMetaParts(
  work: Work,
  locale: Locale,
  t: Translator,
): string[] {
  if (work.category === "personal") {
    return [t(DICT.works.personal), formatPeriod(work.period, locale)];
  }
  const { event, teamSize, start, end } = work.hackathon;
  return [
    t(event),
    locale === "ja" ? `${teamSize}人チーム` : `Team of ${teamSize}`,
    ...(work.role ? [t(work.role)] : []),
    formatDayPeriod(start, end, locale),
  ];
}
