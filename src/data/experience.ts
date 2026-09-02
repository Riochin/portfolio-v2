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
    highlights: [
      {
        ja: "Javaによるオブジェクト指向プログラミングなど、コンピュータ科学の基礎を学習中",
        en: "Studying object-oriented programming in Java and other computer science fundamentals",
      },
    ],
    stack: ["java"],
  },

  "jtp-internship": {
    organization: { ja: "JTP株式会社", en: "JTP Co., Ltd." },
    position: {
      ja: "DXチーム インターンシップ",
      en: "DX Team Internship Program",
    },
    period: { start: "2024-08", end: "2024-08" },
    kind: "internship",
    highlights: [
      {
        ja: "RAGやファイルサーチ機能についての顧客向け紹介動画を制作した",
        en: "Created customer-facing introduction videos about RAG and file search technologies",
      },
      {
        ja: "IT業界への理解を深めた",
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
    highlights: [
      {
        ja: "卒業ハッカソンで「ごめんなさい.com」を開発し、最優秀賞&日本総研賞をW受賞した",
        en: 'Developed "gomen-nasai.com" and won both the Best Award and the Japan Research Institute Award at the graduation hackathon',
      },
      {
        ja: "Flaskを使用したWebアプリケーション開発の基礎を学んだ",
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
        ja: "Pythonを使用したデータ分析の基礎を学び、修了した",
        en: "Completed the course, learning the fundamentals of data analysis using Python",
      },
    ],
    stack: ["python"],
  },

  "google-step": {
    organization: { ja: "グーグル合同会社", en: "Google Japan" },
    position: {
      ja: "Google STEP 教育コース",
      en: "Google STEP Dev Course",
    },
    period: { start: "2025-05", end: "2025-07" },
    kind: "program",
    highlights: [
      {
        ja: "データ構造、アルゴリズム、OS、CPUなど、コンピュータ科学の基礎を学んだ",
        en: "Learned fundamentals of computer science including data structures, algorithms, OS, and CPU architecture",
      },
    ],
  },

  "mercari-bold": {
    organization: { ja: "株式会社メルカリ", en: "Mercari, Inc." },
    position: {
      ja: "Mercari Bold Program for Women",
      en: "Mercari Bold Program for Women",
    },
    period: { start: "2025-08", end: "2025-08" },
    kind: "program",
    highlights: [
      {
        ja: "渡航型プログラムにインドチームのエンジニアとして参加し、女性向け匿名通話アプリ「Ma-ango」の企画・モックアップ開発に携わった",
        en: 'Joined an overseas program as an engineer on the India team, working on the planning and mockup development of "Ma-ango", an anonymous calling app for women',
      },
    ],
  },

  "rakuten-internship": {
    organization: { ja: "楽天グループ株式会社", en: "Rakuten Group, Inc." },
    position: {
      ja: "アプリケーションエンジニア インターンシップ",
      en: "Application Engineer Internship",
    },
    period: { start: "2025-08", end: "2025-10" },
    kind: "internship",
    highlights: [
      {
        ja: "AI & Data Divisionにて、社内向けAIエージェントツールのPoCに携わった",
        en: "Worked on a PoC for an internal AI agent tool in the AI & Data Division",
      },
      {
        ja: "初めてのフルタイムエンジニアインターンシップを経験した",
        en: "Gained my first full-time engineering internship experience",
      },
    ],
  },

  "google-swe-internship": {
    organization: { ja: "グーグル合同会社", en: "Google Japan" },
    position: {
      ja: "ソフトウェアエンジニア インターンシップ",
      en: "Software Engineer Internship",
    },
    period: { start: "2025-11", end: "2026-02" },
    kind: "internship",
    highlights: [
      {
        ja: "Google Mapsのサーバーサイド開発に携わった",
        en: "Worked on server-side development for Google Maps",
      },
      {
        ja: "コードレビューを受けながら、16週間にわたり実践的なエンジニア経験を積んだ",
        en: "Gained hands-on engineering experience over 16 weeks through code reviews",
      },
    ],
  },

  "cyberagent-go-college": {
    organization: { ja: "株式会社サイバーエージェント", en: "CyberAgent, Inc." },
    position: { ja: "Go College", en: "Go College" },
    period: { start: "2026-02", end: "2026-03" },
    kind: "program",
    highlights: [
      {
        ja: "1ヶ月かけて、Goの基本文法・API実装などについて学んだ",
        en: "Spent a month learning Go fundamentals including syntax and API implementation",
      },
      {
        ja: "最終課題では、テストファーストの考え方でアーキテクチャ設計に取り組んだ",
        en: "Focused on architecture design with a test-first approach for the final project",
      },
    ],
    stack: ["go"],
  },
} as const satisfies Record<string, ExperienceEntry>;

export type ExperienceSlug = keyof typeof EXPERIENCES;
