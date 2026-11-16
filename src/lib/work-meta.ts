import type { Work } from "@/data/types";
import { formatDayPeriod, formatPeriod } from "@/lib/date";
import type { Locale } from "@/lib/i18n/config";
import { DICT } from "@/lib/i18n/dictionary";
import type { Translator } from "@/lib/i18n/types";

export type WorkFact = {
  readonly key: "event" | "team" | "role" | "period";
  readonly label: string;
  readonly value: string;
};

/**
 * 詳細ページで技術スタックや受賞歴と同じ見出しで並べる、作品の基本情報。
 *
 * ハッカソン: イベント / チーム / 担当 / 期間 (日単位と長さ)
 * 個人開発:   期間 (月単位)
 *
 * 担当が無い作品は担当を出さない。詳細ページと Markdown 出力が
 * 同じ並びになるよう、ここで組み立てる。
 */
export function workFacts(work: Work, locale: Locale, t: Translator): WorkFact[] {
  const fact = (key: WorkFact["key"], value: string): WorkFact => ({
    key,
    label: t(DICT.works[key]),
    value,
  });
  if (work.category === "personal") {
    return [fact("period", formatPeriod(work.period, locale))];
  }
  const { event, teamSize, start, end } = work.hackathon;
  return [
    fact("event", t(event)),
    fact("team", locale === "ja" ? `${teamSize}人` : `${teamSize} people`),
    ...(work.role ? [fact("role", t(work.role))] : []),
    fact("period", formatDayPeriod(start, end, locale)),
  ];
}
