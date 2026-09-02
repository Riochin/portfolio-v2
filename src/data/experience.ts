import type { ExperienceEntry } from "./types";

/**
 * 所属単位の経験。作品単位の Works とは軸が違うので独立させている (design.md 参照)。
 * レコードのキーがそのまま slug になり、works.relatedExperience の参照先になる。
 */
export const EXPERIENCES = {
  "tsuda-university": {
    organization: { ja: "津田塾大学", en: "Tsuda University" },
    position: {
      ja: "情報科学科",
      en: "Department of Information Science",
    },
    period: { start: "2024-04", end: null },
    kind: "education",
    image: {
      src: "/experience/tsuda_university.webp",
      width: 1477,
      height: 1108,
      alt: {
        ja: "津田塾大学のキャンパスに建つレンガ造りの校舎と花壇",
        en: "A brick campus building and flower bed at Tsuda University",
      },
    },
    highlights: [
      {
        ja: "Javaによるオブジェクト指向プログラミングなど、コンピュータ科学の基礎を学んでいます",
        en: "Studying object-oriented programming in Java and other computer science fundamentals",
      },
    ],
    stack: ["java"],
  },

  "jtp-internship": {
    organization: { ja: "JTP株式会社", en: "JTP Co., Ltd." },
    position: {
      ja: "JTP サマーインターンシップ",
      en: "JTP Summer Internship",
    },
    period: { start: "2024-08", end: "2024-08" },
    kind: "internship",
    highlights: [
      {
        ja: "DXチームに配属され、RAGやファイルサーチ機能についての顧客向け紹介動画を制作しました",
        en: "Assigned to the DX team, creating customer-facing introduction videos about RAG and file search",
      },
      {
        ja: "IT業界への理解を深めました",
        en: "Gained insights into the IT industry",
      },
    ],
  },

  "waffle-college": {
    organization: { ja: "特定非営利活動法人Waffle", en: "NPO Waffle" },
    position: {
      ja: "WaffleCollege テックキャリアコース",
      en: "WaffleCollege Tech Career Course",
    },
    period: { start: "2024-09", end: "2025-01" },
    kind: "program",
    image: {
      src: "/experience/waffle_college.webp",
      width: 1045,
      height: 1567,
      alt: {
        ja: "WaffleCollege の修了式で修了証を受け取る様子",
        en: "Receiving the certificate at the WaffleCollege closing ceremony",
      },
    },
    highlights: [
      {
        ja: "卒業ハッカソンで「ごめんなさい.com」を開発し、最優秀賞&日本総研賞をW受賞しました",
        en: 'Developed "gomen-nasai.com" and won both the Best Award and the Japan Research Institute Award at the graduation hackathon',
      },
      {
        ja: "Flaskを使用したWebアプリケーション開発の基礎を学びました",
        en: "Learned the fundamentals of web application development using Flask",
      },
    ],
    stack: ["python", "flask"],
  },

  "gci-2025-summer": {
    organization: {
      ja: "東京大学 松尾・岩澤研究室",
      en: "Matsuo-Iwazawa Lab, The University of Tokyo",
    },
    position: { ja: "GCI 2025 Summer", en: "GCI 2025 Summer" },
    period: { start: "2025-04", end: "2025-08" },
    kind: "program",
    highlights: [
      {
        ja: "Pythonを使用したデータ分析の基礎を学び、修了しました",
        en: "Completed the course, learning the fundamentals of data analysis using Python",
      },
    ],
    stack: ["python"],
  },

  "mercari-bold": {
    organization: { ja: "株式会社メルカリ", en: "Mercari, Inc." },
    position: {
      ja: "Mercari Bold Program for Women",
      en: "Mercari Bold Program for Women",
    },
    period: { start: "2025-08", end: "2025-08" },
    kind: "program",
    image: {
      src: "/experience/mercari_bold.webp",
      width: 1108,
      height: 1477,
      alt: {
        ja: "メルカリのオフィスの受付に掲げられたロゴ",
        en: "The mercari logo above the office reception desk",
      },
    },
    highlights: [
      {
        ja: "渡航型プログラムにインドチームのエンジニアとして参加し、女性向け匿名通話アプリ「Ma-ango」の企画・モックアップ開発に携わりました",
        en: 'Joined an overseas program as an engineer on the India team, working on the planning and mockup development of "Ma-ango", an anonymous calling app for women',
      },
    ],
    stack: ["figma"],
  },

  "rakuten-internship": {
    organization: { ja: "楽天グループ株式会社", en: "Rakuten Group, Inc." },
    position: {
      ja: "楽天グループ 就業型インターンシップ",
      en: "Rakuten Group Work-based Internship",
    },
    period: { start: "2025-08", end: "2025-10" },
    kind: "internship",
    image: {
      src: "/experience/rakuten_intern.webp",
      width: 1108,
      height: 1477,
      alt: {
        ja: "楽天のオフィスに置かれたお買いものパンダの像",
        en: "Okaimono Panda figures on display at the Rakuten office",
      },
    },
    highlights: [
      {
        ja: "AI & Data Divisionにて、社内向けAIエージェントツールのPoCに携わりました",
        en: "Worked on a PoC for an internal AI agent tool in the AI & Data Division",
      },
      {
        ja: "初めてのフルタイムエンジニアインターンシップを経験しました",
        en: "Gained my first full-time engineering internship experience",
      },
    ],
    stack: ["python", "nextjs"],
  },

  "google-swe-internship": {
    organization: { ja: "グーグル合同会社", en: "Google Japan" },
    position: {
      ja: "Google STEP インターンシップ",
      en: "Google STEP Internship",
    },
    period: { start: "2025-11", end: "2026-02" },
    kind: "internship",
    image: {
      src: "/experience/google_step.webp",
      width: 1950,
      height: 2600,
      alt: {
        ja: "Google オフィスのロゴの前で、プロペラ付きの帽子をかぶって立つ様子",
        en: "Standing in front of the Google logo wall wearing a propeller hat",
      },
    },
    highlights: [
      {
        ja: "Google Mapsのサーバーサイド開発に携わりました",
        en: "Worked on server-side development for Google Maps",
      },
      {
        ja: "コードレビューを受けながら、16週間にわたり実践的なエンジニア経験を積みました",
        en: "Gained hands-on engineering experience over 16 weeks through code reviews",
      },
    ],
    stack: ["java", "kotlin"],
  },

  "cyberagent-go-college": {
    organization: { ja: "株式会社サイバーエージェント", en: "CyberAgent, Inc." },
    position: { ja: "CA Go College", en: "CA Go College" },
    period: { start: "2026-02", end: "2026-03" },
    kind: "program",
    image: {
      src: "/experience/ca_go_college.webp",
      width: 1950,
      height: 2600,
      alt: {
        ja: "サイバーエージェントのオフィスで、アメーバくんの像の横にしゃがむ様子",
        en: "Crouching beside the Ameba mascot statue at the CyberAgent office",
      },
    },
    highlights: [
      {
        ja: "1ヶ月かけて、Goの基本文法・API実装などについて学びました",
        en: "Spent a month learning Go fundamentals including syntax and API implementation",
      },
      {
        ja: "最終課題では、テストファーストの考え方でアーキテクチャ設計に取り組みました",
        en: "Focused on architecture design with a test-first approach for the final project",
      },
    ],
    stack: ["go"],
  },

  "cygames-5days": {
    organization: { ja: "株式会社Cygames", en: "Cygames, Inc." },
    position: {
      ja: "Cygames エンジニアコース（サマー）",
      en: "Cygames Engineer Course (Summer)",
    },
    period: { start: "2026-07", end: "2026-07" },
    kind: "internship",
    highlights: [
      {
        ja: "Unity / C# と Git/GitHub を基礎から学び、5日間でゲーム実装を拡張する課題に取り組みました",
        en: "Learned Unity, C# and Git/GitHub from the ground up, then spent five days extending a game implementation",
      },
    ],
    stack: ["unity", "csharp"],
  },

  "mixi-internship": {
    organization: { ja: "株式会社MIXI", en: "MIXI, Inc." },
    position: {
      ja: "DIVE INTO MIXI 2026（就業型インターンシップ）",
      en: "DIVE INTO MIXI 2026 (Work-based Internship)",
    },
    period: { start: "2026-07", end: "2026-08" },
    kind: "internship",
    image: {
      src: "/experience/mixi_intern.webp",
      width: 1333,
      height: 889,
      alt: {
        ja: "DIVE INTO MIXI 2026 の修了証と MIXI のうちわ",
        en: "The DIVE INTO MIXI 2026 certificate next to MIXI paper fans",
      },
    },
    highlights: [
      {
        ja: "mixi2 事業部に配属され、新規機能のアイデア出しから仕様書の作成、実装までフルスタックで担当しました",
        en: "Assigned to the mixi2 team, working full-stack on a new feature from ideation through spec writing to implementation",
      },
    ],
    stack: ["flutter", "go", "typescript"],
  },
} as const satisfies Record<string, ExperienceEntry>;

export type ExperienceSlug = keyof typeof EXPERIENCES;
