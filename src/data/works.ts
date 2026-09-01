import type { Work } from "./types";

export const works: Work[] = [
  {
    title: "サンプル作品",
    period: "2025",
    description:
      "ここに作品の説明が入ります。実データは後で差し替えてください。",
    role: "フロントエンド",
    stack: ["Next.js", "TypeScript"],
    links: {
      repo: "https://github.com/riochin",
    },
  },
  {
    title: "サンプル作品2",
    period: "2024",
    description:
      "ここに作品の説明が入ります。実データは後で差し替えてください。",
    role: "バックエンド",
    stack: ["Go", "PostgreSQL"],
    links: {
      demo: "https://example.com",
    },
  },
  {
    title: "サンプル作品3",
    period: "2024",
    description:
      "ここに作品の説明が入ります。実データは後で差し替えてください。",
    role: "デザイン",
    stack: ["Figma"],
    links: {},
  },
];
