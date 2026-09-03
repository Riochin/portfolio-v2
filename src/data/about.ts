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
 * facts は名前のすぐ下 ── 写真・名前と一続きの中央揃えの塊なので、
 * 項目を増やすほど本文が下に押し出される。ここは 2 項目までに抑えること。
 * 値の改行はそのまま出る (dd 側の whitespace-pre-line) ので、所属のように
 * 単位で読ませたいものは行を分けて書く。
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
      // 大学 → 学部学科 → 研究室 と、大きい単位から 1 行ずつ。
      // 1 行に詰めると読み手が区切りを探すことになるうえ、幅次第で
      // 折り返し位置が変わって「どこで切れるか」が固定できない。
      value: {
        ja: `津田塾大学 ${GRADE}年
学芸学部 情報科学科
栗原研究室`,
        en: `Tsuda University, Year ${GRADE}
College of Liberal Arts, Department of Information Science
Kurihara Lab`,
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
        { ja: "UI/UX（インタラクション）", en: "UI/UX (interaction)" },
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
      ja: "2024年12月、人生初のハッカソンでWeb開発の楽しさに目覚めました！（ハッカソン楽しい！）",
      en: "In December 2024 I went to my first ever hackathon, and that was it — I was hooked on web development. (Hackathons are so much fun!)",
    },
    {
      // 「わかりやすさ」の対象はあえて絞らない。発表も SNS の投稿も
      // ページもコードも同じこだわりなので、EN も "easy to use" や
      // "easy to read" に落とさず "easy to understand" のままにしてある。
      // `**…**` は About ページ側で <strong> に開かれる強調記法 (本文ではない)。
      ja: "プロダクトをつくること自体が大好きで、つくりたいものに必要であればデザインからインフラまでフルスタックに触ります。**「わかりやすくする」**ことに強いこだわりがあります。",
      en: "What I love is building products themselves, so I reach for whatever a project needs — from design all the way through to infrastructure. Above all, I care about making things **easy to understand**.",
    },
    {
      ja: "ひとりで開発するのも好きですが、誰かと開発するのはもっと好きです❗️😸",
      en: "I love building things on my own, but I love building them with other people even more❗️😸",
    },
  ] satisfies readonly Localized<string>[],
} as const;
