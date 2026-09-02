import { academicYear } from "@/lib/date";
import type { Localized } from "@/lib/i18n/types";
import { EXPERIENCES } from "./experience";
import type { ImageRef, ProfileFact, ProfileSection } from "./types";

/** 在学中の学年。入学年月は Experience 側が持っているのでそこから導く。 */
const GRADE = academicYear(EXPERIENCES["tsuda-university"].period.start);

/**
 * About ページのコンテンツ。
 *
 * 段落は `readonly Localized<string>[]` で持つ ── 旧サイトは
 * `{ en: string[]; ja: string[] }` だったため EN 4 段落 / JA 3 段落にずれていた。
 * この形なら段落数のずれが構造的に起きない。
 *
 * 事実は段落ではなく「ラベル: 値」で持ち、置き場所で 2 つに分ける。
 * facts は写真の横 ── 名前とセットで一目に入る枠なので、増やすと写真の下に
 * はみ出してブロックが崩れる。ここは 2 行までに抑えること。
 * sections は本文の下 ── 見出し付きで独立して置くので、行数の制約がない。
 */
export const ABOUT = {
  photo: {
    src: "/profile.webp",
    width: 800,
    height: 800,
    alt: { ja: "Riochin のプロフィール写真", en: "Photo of Riochin" },
  } satisfies ImageRef,

  facts: [
    {
      label: { ja: "所属", en: "Affiliation" },
      value: {
        ja: `津田塾大学 学芸学部 情報科学科 ${GRADE}年 / 栗原研究室`,
        en: `Kurihara Lab, Department of Information Science, College of Liberal Arts, Tsuda University (year ${GRADE})`,
      },
    },
    {
      label: { ja: "好きなもの", en: "Favorites" },
      value: {
        ja: "ジョジョ、ガンダム、ハッカソン",
        en: "JoJo's Bizarre Adventure, Gundam, hackathons",
      },
    },
  ] satisfies readonly ProfileFact[],

  sections: [
    {
      label: { ja: "興味があること", en: "Interests" },
      items: [
        { ja: "Go言語", en: "Go" },
        { ja: "API設計", en: "API design" },
        {
          ja: "クラウドインフラ（AWS、Cloudflare）",
          en: "Cloud infrastructure (AWS, Cloudflare)",
        },
        {
          ja: "UI/UX（インタラクション、モーション）",
          en: "UI/UX (interaction and motion)",
        },
      ],
    },
  ] satisfies readonly ProfileSection[],

  /**
   * 連絡先。sections に混ぜず独立させているのは、値がテキストではなく
   * mailto: リンクになるため (ProfileFact は文字列しか持てない)。
   * アドレス自体は SITE.email が持つ。
   */
  contact: {
    label: { ja: "連絡先", en: "Contact" },
    note: {
      ja: "カジュアルなご連絡は X の DM、お仕事など正式なご連絡はメールでお願いします。",
      en: "For casual messages, a DM on X works best. For anything formal, please use email.",
    } satisfies Localized<string>,
  },

  paragraphs: [
    {
      ja: "2024年12月にハッカソンに初参加したことからWeb開発の楽しさに目覚めました。（ハッカソン楽しい！）",
      en: "My first hackathon in December 2024 opened my eyes to how fun web development is. (Hackathons are the best!)",
    },
    {
      ja: "プロダクトを作ること自体が大好きで、作りたいものに必要であればデザインからインフラまでフルスタックに触っています。",
      en: "What I love is building products themselves, so I reach for whatever a project needs — from design all the way through to infrastructure.",
    },
    {
      ja: "また、同じくらいチームでのものづくりが好きです。ハッカソンやインターンで、人と話しながら自分のアイデアが磨かれていく瞬間がとても好きです。",
      en: "I love making things with other people just as much. In hackathons and internships, the moment when an idea of mine gets sharpened by talking it through with someone is what I enjoy most.",
    },
  ] satisfies readonly Localized<string>[],
} as const;
