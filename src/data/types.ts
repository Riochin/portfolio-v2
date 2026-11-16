import type { Localized } from "@/lib/i18n/types";
import type { Day, Period, YearMonth, YearMonthDay } from "@/lib/date";
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
  /** 同じ月の受賞どうしの前後を決めるためだけの日。表示には出さない。 */
  readonly day?: Day;
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

/**
 * 作品が動く場所。ひとことに「Webアプリ」「iOSアプリ」と書くと作品ごとに
 * 言い方が揺れるので、決まった語のタグとして持つ。表示名は DICT.platforms。
 */
export type Platform =
  | "web"
  | "ios"
  | "android"
  | "apple-watch"
  | "chrome-extension"
  | "discord";

/**
 * ハッカソンの開催情報。ハッカソンは 2 日から 2 か月まで長さの幅が大きく、
 * 月単位の期間では「どれくらいの期間で作ったか」が伝わらないので日まで持つ。
 * `end: null` は終わったあとも開発を続けている作品。
 */
export type Hackathon = {
  readonly event: Localized<string>;
  readonly teamSize: number;
  readonly start: YearMonthDay;
  readonly end: YearMonthDay | null;
};

type WorkEntryBase = {
  readonly title: Localized<string>;
  /** 受賞一覧のように行が詰まる場所で使う短縮形。無ければ title を使う。 */
  readonly shortTitle?: Localized<string>;
  /** 一覧で見せる 1 行説明。最後は「何をするものか」の語で締める。 */
  readonly tagline: Localized<string>;
  /**
   * 詳細ページの「概要」(何を、なぜ、どう作ったか)。段落ごとに両言語を持つ。
   * 段落の中には `[文字](/works/off)` の形でリンクを書ける (lib/inline-links.ts)。
   */
  readonly summary: readonly Localized<string>[];
  /** 「ふりかえり」(担当、チーム、学んだこと、思い出)。無い作品は空配列。 */
  readonly retro: readonly Localized<string>[];
  /**
   * 担当。区切りは「・」、PM を先頭に、領域はフロントエンド / バックエンド /
   * インフラ / フルスタックの語で書く (英語は "PM / Backend")。個人開発は持たない。
   */
  readonly role?: Localized<string>;
  readonly platforms: readonly Platform[];
  readonly stack: readonly SkillSlug[];
  readonly links: WorkLinks;
  readonly image?: ImageRef;
  readonly awards?: readonly Award[];
  readonly relatedExperience?: ExperienceSlug;
  readonly featured?: boolean;
};

/**
 * 作品の記述用シェイプ。slug はレコードのキーから来るので持たない。
 * category は必須で、作品を足すときに個人制作かハッカソンかを必ず決めさせる。
 * ハッカソンは日付を hackathon に持ち、月単位の period はアクセサが導く
 * (同じ期間を 2 か所に書いてずれないように)。
 */
export type WorkEntry = WorkEntryBase &
  (
    | { readonly category: "personal"; readonly period: Period }
    | { readonly category: "hackathon"; readonly hackathon: Hackathon }
  );

export type Work = WorkEntry & {
  readonly slug: string;
  readonly period: Period;
};

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

/**
 * トップの Experience (道のり) の 1 行。経歴の一覧ではなく、節目だけを名前で書く。
 *
 * href は続きが読めるものだけに付ける。`/` 始まりはサイト内 (ロケールを
 * 前に足す)、それ以外は外部の記事として新しいタブで開く。
 */
export type JourneyStep = {
  readonly date: YearMonth;
  readonly text: Localized<string>;
  readonly href?: string;
};
