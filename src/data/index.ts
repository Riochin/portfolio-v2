import { WORKS, type WorkSlug } from "./works";
import { EXPERIENCES, type ExperienceSlug } from "./experience";
import { SKILLS, type Skill, type SkillSlug } from "./skills";
import { compareStartDesc, comparePeriodDesc, yearOf } from "@/lib/date";
import type { Year } from "@/lib/date";
import type {
  Award,
  AwardEntry,
  Experience,
  Work,
  WorkCategory,
} from "./types";

/**
 * アクセサ層。並び替えとフィルタはここだけに置く。
 * (旧サイトはソートが一切なく、データファイルの記述順がそのまま表示順だった)
 *
 * 全て同期・ロケール非依存にしてあるのが重要な制約。
 * opengraph-image.tsx は Route Handler 扱いで next/root-params を使えないため、
 * ここがロケールを知っていると OG 画像から呼べなくなる。
 * ロケールの解決は描画側で t() を使って行う。
 */

const ALL_WORKS: readonly Work[] = Object.entries(WORKS)
  .map(([slug, entry]) => ({ slug, ...entry }))
  .sort((a, b) => comparePeriodDesc(a.period, b.period));

/** 開始年で見出しを立てるので、Works の終了日基準ではなく開始日の新しい順。 */
const ALL_EXPERIENCES: readonly Experience[] = Object.entries(EXPERIENCES)
  .map(([slug, entry]) => ({ slug, ...entry }))
  .sort((a, b) => compareStartDesc(a.period, b.period));

export type ExperienceYearGroup = {
  readonly year: Year;
  readonly experiences: readonly Experience[];
};

/**
 * 開始年ごとの塊。年をまたぐ経験は開始年の側に置く。
 * ALL_EXPERIENCES が既に開始日の降順なので、隣が同じ年かを見るだけで畳める。
 */
const EXPERIENCES_BY_YEAR: readonly ExperienceYearGroup[] =
  ALL_EXPERIENCES.reduce<{ year: Year; experiences: Experience[] }[]>(
    (groups, experience) => {
      const year = yearOf(experience.period.start);
      const last = groups.at(-1);
      if (last?.year === year) last.experiences.push(experience);
      else groups.push({ year, experiences: [experience] });
      return groups;
    },
    [],
  );

const ALL_AWARDS: readonly AwardEntry[] = ALL_WORKS.flatMap((work) =>
  (work.awards ?? []).map((award) => ({
    ...award,
    work: { slug: work.slug, title: work.shortTitle ?? work.title },
  })),
).sort((a, b) => b.date.localeCompare(a.date));

/** 受賞バッジで「一番良い賞」を選ぶための序列。 */
const RANK_ORDER = {
  grand: 0,
  excellence: 1,
  sponsor: 2,
  finalist: 3,
  other: 4,
} as const;

export function getWorks(): readonly Work[] {
  return ALL_WORKS;
}

export function getFeaturedWorks(): readonly Work[] {
  return ALL_WORKS.filter((work) => work.featured);
}

export function getWorkSlugs(): WorkSlug[] {
  return Object.keys(WORKS) as WorkSlug[];
}

export function getWorkBySlug(slug: string): Work | undefined {
  return ALL_WORKS.find((work) => work.slug === slug);
}

/** 一覧に出す順。個人制作を先に置く。 */
const WORK_CATEGORY_ORDER: readonly WorkCategory[] = ["personal", "hackathon"];

export type WorkCategoryGroup = {
  readonly category: WorkCategory;
  readonly works: readonly Work[];
};

/**
 * 出自ごとの塊。空のカテゴリは落とすので、
 * 片方しか作品が無いうちは見出しごと出てこない。
 */
const WORKS_BY_CATEGORY: readonly WorkCategoryGroup[] = WORK_CATEGORY_ORDER.map(
  (category) => ({
    category,
    works: ALL_WORKS.filter((work) => work.category === category),
  }),
).filter((group) => group.works.length > 0);

/** 出自で束ねた作品 (各塊の中は getWorks() と同じ新しい順)。 */
export function getWorksByCategory(): readonly WorkCategoryGroup[] {
  return WORKS_BY_CATEGORY;
}

export function getWorksByExperience(slug: ExperienceSlug): readonly Work[] {
  return ALL_WORKS.filter((work) => work.relatedExperience === slug);
}

/** その作品で最も上位の受賞。一覧のバッジ表示に使う。 */
export function getTopAward(work: Work): Award | undefined {
  if (!work.awards || work.awards.length === 0) return undefined;
  return [...work.awards].sort(
    (a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank],
  )[0];
}

/** 開始年で束ねた経歴 (新しい年から)。 */
export function getExperiencesByYear(): readonly ExperienceYearGroup[] {
  return EXPERIENCES_BY_YEAR;
}

export function getExperienceBySlug(slug: string): Experience | undefined {
  return ALL_EXPERIENCES.find((experience) => experience.slug === slug);
}

/** 作品横断の受賞一覧 (日付の新しい順)。 */
export function getAwards(): readonly AwardEntry[] {
  return ALL_AWARDS;
}

export function getSkill(slug: SkillSlug): Skill {
  return { slug, ...SKILLS[slug] };
}

export function getSkills(slugs: readonly SkillSlug[]): Skill[] {
  return slugs.map(getSkill);
}

export function getFeaturedSkills(): Skill[] {
  return (Object.keys(SKILLS) as SkillSlug[])
    .map(getSkill)
    .filter((skill) => skill.featured);
}
