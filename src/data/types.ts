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

/**
 * 作品の出自。ハッカソン作品と個人制作は読み手の見方が変わる
 * (前者は受賞とチーム開発、後者は継続的な自主制作) ので一覧で束ねて分ける。
 */
export type WorkCategory = "personal" | "hackathon";

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
  /** 受賞一覧のように行が詰まる場所で使う短縮形。無ければ title を使う。 */
  readonly shortTitle?: Localized<string>;
  /** 一覧で見せる 1 行説明 (旧 description)。 */
  readonly tagline: Localized<string>;
  /** 詳細ページの本文 (旧 longDescription)。段落ごとに両言語を持つ。 */
  readonly body: readonly Localized<string>[];
  /** 必須。作品を足すときに個人制作かハッカソンかを必ず決めさせる。 */
  readonly category: WorkCategory;
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
  /**
   * プログラム名・役職。一覧では organization より上に太字で出る見出しなので、
   * 所属名が無くても何のプログラムか分かる書き方にする ("Go College" ではなく
   * "CA Go College")。
   */
  readonly position: Localized<string>;
  readonly period: Period;
  readonly highlights: readonly Localized<string>[];
  readonly kind: ExperienceKind;
  readonly stack?: readonly SkillSlug[];
  readonly url?: string;
  /** 一覧の左に出すサムネイル。無い経験もあるので任意。 */
  readonly image?: ImageRef;
};

export type Experience = ExperienceEntry & { readonly slug: string };

/** 導出型: どの作品の受賞かを逆参照で持つ。 */
export type AwardEntry = Award & {
  readonly work: { readonly slug: string; readonly title: Localized<string> };
};

/**
 * About の写真の横に並べる「ラベル: 値」の 1 行。
 * 段落 (ABOUT.paragraphs) と違って拾い読みできるので、所属や好きなもののような
 * 事実はこちらに置く。行を足したいときは about.ts の配列に 1 要素足すだけでよい。
 */
export type ProfileFact = {
  readonly label: Localized<string>;
  readonly value: Localized<string>;
};

/**
 * About の本文の下に見出し付きで置くセクション。
 *
 * ProfileFact と分けているのは値が配列だから。Localized は必ず葉に置くので
 * `readonly Localized<string>[]` であって `Localized<readonly string[]>` では
 * ない ── 後者だと日英で項目数がずれても型が通ってしまう。
 */
export type ProfileSection = {
  readonly label: Localized<string>;
  readonly items: readonly Localized<string>[];
};
