import type { Localized } from "@/lib/i18n/types";
import type { ImageRef } from "./types";

/**
 * About ページのコンテンツ。
 *
 * 段落は `readonly Localized<string>[]` で持つ ── 旧サイトは
 * `{ en: string[]; ja: string[] }` だったため EN 4 段落 / JA 3 段落にずれていた。
 * この形なら段落数のずれが構造的に起きない。
 */
export const ABOUT = {
  photo: {
    src: "/profile.webp",
    width: 800,
    height: 800,
    alt: { ja: "Riochin のプロフィール写真", en: "Photo of Riochin" },
  } satisfies ImageRef,

  paragraphs: [
    {
      ja: "津田塾大学 情報科学科に通う3年生です。",
      en: "I am a third-year student in the Department of Information Science at Tsuda University.",
    },
    {
      ja: "2024年12月にハッカソンに初参加したことからWeb開発の楽しさに目覚め、気づけば毎月ハッカソンに出ていました。ハッカソン楽しい！",
      en: "My first hackathon in December 2024 got me hooked on web development, and before I knew it I was entering one every month. Hackathons are fun!",
    },
    {
      ja: "最近はバックエンドエンジニアを目指して勉強中です！",
      en: "These days I am studying with the goal of becoming a backend engineer.",
    },
  ] satisfies readonly Localized<string>[],
} as const;
