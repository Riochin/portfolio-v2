import type { Localized } from "@/lib/i18n/types";

/**
 * サイト全体のアイデンティティ情報。
 *
 * ここが唯一の情報源。以前は "Riochin" / "Rio Ichikawa" がナビ・コピーライト・
 * OG 画像・ヒーローの計 6 箇所に、外部サービスのユーザー名が
 * lib/output/config.ts と SocialLinks.tsx の 2 系統に散っていた。
 */
export const SITE = {
  url: "https://riochin.dev",
  /** ワードマーク。ロゴとして描くので Localized にしない。 */
  brand: "Riochin",
  /** 表示名。ja でもローマ字表記で統一する。 */
  name: "Rio Ichikawa",
  description: {
    ja: "Riochin のポートフォリオサイト",
    en: "Portfolio of Rio Ichikawa",
  } satisfies Localized<string>,
  copyrightStartYear: 2026,
  /** 外部サービスのユーザー名。SNS リンクと Output のフィード取得が共にここを読む。 */
  accounts: {
    github: "riochin",
    mixi2: "riochin",
    x: "riochin",
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
};

export const SOCIAL_LINKS = [
  {
    key: "github",
    label: "GitHub",
    href: `https://github.com/${SITE.accounts.github}`,
  },
  {
    key: "mixi2",
    label: "mixi2",
    href: `https://mixi.social/@${SITE.accounts.mixi2}`,
  },
  { key: "x", label: "X", href: `https://x.com/${SITE.accounts.x}` },
  {
    key: "speakerdeck",
    label: "Speaker Deck",
    href: `https://speakerdeck.com/${SITE.accounts.speakerdeck}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: `https://www.linkedin.com/in/${SITE.accounts.linkedin}/`,
  },
  {
    key: "zenn",
    label: "Zenn",
    href: `https://zenn.dev/${SITE.accounts.zenn}`,
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
