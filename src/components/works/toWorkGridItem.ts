import type { WorkGridItem } from "./WorkGrid";
import { getSkills } from "@/data";
import type { Work } from "@/data/types";
import { formatPeriod } from "@/lib/date";
import { localePath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/config";
import type { Translator } from "@/lib/i18n/types";

/** 一覧のタイルに出す技術チップの上限。 */
const STACK_PREVIEW = 3;

/**
 * 作品をタイル用のプレーンなデータに解決する。Client Component に渡す前の
 * ロケール解決はここ 1 箇所 (Works の一覧とトップの Featured works が使う)。
 */
export function toWorkGridItem(
  work: Work,
  locale: Locale,
  t: Translator,
): WorkGridItem {
  return {
    slug: work.slug,
    href: localePath(locale, `/works/${work.slug}`),
    title: t(work.title),
    period: formatPeriod(work.period, locale),
    image: work.image && {
      src: work.image.src,
      width: work.image.width,
      height: work.image.height,
      alt: t(work.image.alt),
    },
    stack: getSkills(work.stack.slice(0, STACK_PREVIEW)).map((s) => s.label),
  };
}
