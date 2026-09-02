import type { Localized } from "@/lib/i18n/types";
import type { Period, YearMonth } from "@/lib/date";
import type { SkillSlug } from "./skills";
import type { ExperienceSlug } from "./experience";

/**
 * 画像参照。width/height を必須にしてあるのは、
 * next/image の fill を使わず intrinsic サイズで描くため (CLS が出ない)。
 * 旧サイトは image が裸の string で、寸法も alt も持っていなかった。
 */
export type ImageRef = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: Localized<string>;
};

export type AwardRank =
  | "grand"
  | "excellence"
  | "sponsor"
  | "finalist"
  | "other";

/**
 * 受賞。
 * 旧サイトは 'Progateハッカソン powerd by AWS 優秀賞' のように
 * イベント名・賞名・スポンサーを 1 本の文字列に詰めていたため、
 * 作品横断の受賞一覧を導出できなかった。
 */
export type Award = {
  readonly event: Localized<string>;
  readonly prize: Localized<string>;
  readonly rank: AwardRank;
  /** スポンサー賞のときの企業名。 */
  readonly sponsor?: Localized<string>;
  readonly date: YearMonth;
  readonly url?: string;
};

export type WorkLinks = {
  readonly repo?: string;
  readonly demo?: string;
  /** topaz.dev / Canva などの紹介ページ。 */
  readonly article?: string;
  readonly slides?: string;
};

/** 作品の記述用シェイプ。slug はレコードのキーから来るので持たない。 */
export type WorkEntry = {
  readonly title: Localized<string>;
  /** 一覧で見せる 1 行説明 (旧 description)。 */
  readonly tagline: Localized<string>;
  /** 詳細ページの本文 (旧 longDescription)。段落ごとに両言語を持つ。 */
  readonly body: readonly Localized<string>[];
  readonly period: Period;
  readonly role?: Localized<string>;
  readonly stack: readonly SkillSlug[];
  readonly links: WorkLinks;
  readonly image?: ImageRef;
  readonly awards?: readonly Award[];
  readonly relatedExperience?: ExperienceSlug;
  readonly featured?: boolean;
};

export type Work = WorkEntry & { readonly slug: string };

export type ExperienceKind = "education" | "internship" | "program";

export type ExperienceEntry = {
  /** 旧サイトの company は英語のみだったので Localized にする。 */
  readonly organization: Localized<string>;
  readonly position: Localized<string>;
  readonly period: Period;
  readonly highlights: readonly Localized<string>[];
  readonly kind: ExperienceKind;
  readonly stack?: readonly SkillSlug[];
  readonly url?: string;
};

export type Experience = ExperienceEntry & { readonly slug: string };

/** 導出型: どの作品の受賞かを逆参照で持つ。 */
export type AwardEntry = Award & {
  readonly work: { readonly slug: string; readonly title: Localized<string> };
};
