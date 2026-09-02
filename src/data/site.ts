import type { Localized } from "@/lib/i18n/types";

/**
 * X のユーザー名。名乗り (handle / handleUrl) と SNS リンクの両方がここを読む。
 * accounts の中に書けないのは、handle が accounts より前で組み立てられるため。
 */
const X_USER = "riochin555";

/**
 * サイト全体のアイデンティティ情報。
 *
 * ここが唯一の情報源。以前は "Riochin" / "Rio Ichikawa" がナビ・コピーライト・
 * OG 画像・ヒーローの計 6 箇所に、外部サービスのユーザー名が
 * lib/output/config.ts と SocialLinks.tsx の 2 系統に散っていた。
 */
export const SITE = {
  url: "https://riochin.dev",
  /** ブランド名。メタデータ・コピーライト・OG が読む。 */
  brand: "Riochin",
  /** ナビに筆記体で描くワードマーク。ドメインを名乗るので brand とは別に持つ。 */
  wordmark: "Riochin.dev",
  /** 表示名。ja でもローマ字表記で統一する。 */
  name: "Rio Ichikawa",
  /** About の見出しで名前に添えるハンドル。表示は "@" 付き、リンク先は handleUrl。 */
  handle: `@${X_USER}`,
  /** handle のリンク先。名乗りをクリックしたら X の本人に飛ぶ。 */
  handleUrl: `https://x.com/${X_USER}`,
  /** 公開する連絡先。About の連絡先セクションが mailto: にして読む。 */
  email: "118029.ichikama@gmail.com",
  description: {
    ja: "Riochin のポートフォリオサイト",
    en: "Portfolio of Rio Ichikawa",
  } satisfies Localized<string>,
  copyrightStartYear: 2026,
  /** 外部サービスのユーザー名。SNS リンクと Output のフィード取得が共にここを読む。 */
  accounts: {
    github: "riochin",
    mixi2: "riochin",
    x: X_USER,
    speakerdeck: "riochin",
    zenn: "riochin",
    qiita: "riochin",
    linkedin: "rio-ichikawa-94332b361",
  },
} as const;

export type SocialKey =
  | "github"
  | "mixi2"
  | "x"
  | "speakerdeck"
  | "linkedin"
  | "zenn";

/**
 * アイコンのコンポーネント参照はここに置かない。
 * データをシリアライズ可能に保ち、Server -> Client 境界 (MobileMenu) を越えられるようにするため。
 * key -> コンポーネントの対応は SocialLinks.tsx が持つ。
 */
export type SocialLink = {
  readonly key: SocialKey;
  /** ブランド名なので日英共通。 */
  readonly label: string;
  readonly href: string;
  /**
   * ホバー時に載せるブランド色。CSS の `fill` に入る値なので、単色の他に
   * `url(#...)` でアイコン自身が持つグラデーションも指せる (mixi2 がそれ)。
   * 参照先の id はアイコンコンポーネント側で定義する。
   */
  readonly brand: string;
  /**
   * 暗い背景で brand が沈むブランド (黒がブランド色の GitHub / X) の差し替え。
   * 省略時は brand をそのまま使う。
   */
  readonly brandDark?: string;
};

export const SOCIAL_LINKS = [
  {
    key: "github",
    label: "GitHub",
    href: `https://github.com/${SITE.accounts.github}`,
    brand: "#181717",
    brandDark: "#ffffff",
  },
  {
    key: "mixi2",
    label: "mixi2",
    href: `https://mixi.social/@${SITE.accounts.mixi2}`,
    brand: "url(#mixi2-brand)",
  },
  {
    key: "x",
    label: "X",
    href: `https://x.com/${SITE.accounts.x}`,
    brand: "#000000",
    brandDark: "#ffffff",
  },
  {
    key: "speakerdeck",
    label: "Speaker Deck",
    href: `https://speakerdeck.com/${SITE.accounts.speakerdeck}`,
    brand: "#009287",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: `https://www.linkedin.com/in/${SITE.accounts.linkedin}/`,
    brand: "#0a66c2",
  },
  {
    key: "zenn",
    label: "Zenn",
    href: `https://zenn.dev/${SITE.accounts.zenn}`,
    brand: "#3ea8ff",
  },
] as const satisfies readonly SocialLink[];

export type NavKey = "about" | "works" | "experience" | "output";

/** path は URL 構造なのでここ。label は UI 文言なので dictionary 側に置く。 */
export const NAV_ITEMS = [
  { key: "about", path: "/about" },
  { key: "works", path: "/works" },
  { key: "experience", path: "/experience" },
  { key: "output", path: "/output" },
] as const satisfies readonly { key: NavKey; path: string }[];
