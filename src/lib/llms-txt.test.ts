import { describe, expect, it } from "vitest";

import { getExperiencesByYear, getFeaturedSkills, getWorks } from "@/data";
import type { Experience, Work } from "@/data/types";
import { getArticles, getPublishedArticles } from "@/lib/articles";
import { buildLlmsTxt, type LlmsTxtInput } from "./llms-txt";

const work: Work = {
  slug: "sample",
  title: { ja: "サンプル", en: "Sample [beta]" },
  tagline: { ja: "説明", en: "A sample\nproject" },
  body: [],
  category: "hackathon",
  period: { start: "2025-06", end: "2025-06" },
  stack: [],
  links: {},
  awards: [
    {
      event: { ja: "ハッカソン", en: "Some Hack" },
      prize: { ja: "企業賞", en: "Sponsor Award" },
      sponsor: { ja: "会社", en: "Acme" },
      rank: "sponsor",
      date: "2025-06",
    },
  ],
};

const experience: Experience = {
  slug: "school",
  organization: { ja: "大学", en: "Some University" },
  position: { ja: "学部", en: "Department of Things" },
  period: { start: "2024-04", end: null },
  kind: "education",
  highlights: [],
};

const input: LlmsTxtInput = {
  works: [work],
  experiences: [experience],
  articles: [{ slug: "hello", title: "はじめまして", publishedAt: "2026-09-03" }],
  skills: [{ slug: "go", label: "Go", category: "language" }],
};

/** "## 見出し" から次の見出しまで。 */
function section(text: string, heading: string): string {
  const start = text.indexOf(`\n## ${heading}\n`);
  expect(start, `## ${heading} が無い`).toBeGreaterThanOrEqual(0);
  const rest = text.slice(start + 1);
  const next = rest.indexOf("\n## ");
  return next === -1 ? rest : rest.slice(0, next);
}

describe("buildLlmsTxt", () => {
  const text = buildLlmsTxt(input);

  it("llmstxt.org の形: H1 → 要約の引用 → H2 の節", () => {
    const lines = text.split("\n");
    expect(lines[0]).toBe("# Rio Ichikawa (Riochin)");
    expect(lines[2]).toMatch(/^> /);
    // H1 は 1 つだけ。
    expect(lines.filter((l) => l.startsWith("# "))).toHaveLength(1);
    expect(text.endsWith("\n")).toBe(true);
  });

  it("いつ使うか・どう読むかを書く", () => {
    expect(section(text, "When to use this site")).toContain("not a good fit");
    const howTo = section(text, "How to read this site");
    expect(howTo).toContain("Accept: text/markdown");
    expect(howTo).toContain("https://riochin.dev/sitemap.xml");
  });

  it("作品は詳細ページへのリンクと、期間・説明・受賞を 1 行に", () => {
    expect(section(text, "Works")).toContain(
      "- [Sample \\[beta\\]](https://riochin.dev/en/works/sample): Hackathon project, 2025-06. A sample project. Awards: Sponsor Award (Acme) at Some Hack.",
    );
  });

  it("賞名が社名を含むなら重ねず、! で終わる説明に句点を足さない", () => {
    const line = buildLlmsTxt({
      ...input,
      works: [
        {
          ...work,
          tagline: { ja: "説明", en: "Wow!" },
          awards: [{ ...work.awards![0], prize: { ja: "賞", en: "Acme Award" } }],
        },
      ],
    });
    expect(line).toContain("Wow! Awards: Acme Award at Some Hack.");
  });

  it("経歴は継続中を present と書く", () => {
    expect(section(text, "Experience")).toContain(
      "- [Department of Things](https://riochin.dev/en/experience): Some University, 2024-04 to present.",
    );
  });

  it("記事は日本語のページへリンクする", () => {
    expect(section(text, "Blog posts")).toContain(
      "- [はじめまして](https://riochin.dev/ja/blog/hello): Published 2026-09-03. In Japanese.",
    );
  });

  it("記事が無ければ節ごと出さない", () => {
    expect(buildLlmsTxt({ ...input, articles: [] })).not.toContain("## Blog posts");
  });

  it("連絡先と SNS は Optional に置く", () => {
    const optional = section(text, "Optional");
    expect(optional).toContain("(mailto:hello@riochin.dev)");
    expect(optional).toContain("(https://github.com/riochin)");
  });
});

describe("実データでの /llms.txt", () => {
  const text = buildLlmsTxt({
    works: getWorks(),
    experiences: getExperiencesByYear().flatMap((g) => g.experiences),
    articles: getPublishedArticles(),
    skills: getFeaturedSkills(),
  });

  it("全作品が載る", () => {
    for (const w of getWorks()) {
      expect(text).toContain(`(https://riochin.dev/en/works/${w.slug})`);
    }
  });

  it("下書きの記事は載らない", () => {
    const drafts = getArticles().filter((a) => a.draft === true);
    for (const a of drafts) {
      expect(text).not.toContain(`/blog/${a.slug})`);
    }
  });

  it("リンク項目はどれも 1 行で、壊れたリンク記法を含まない", () => {
    const items = text.split("\n").filter((l) => l.startsWith("- ["));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item).toMatch(/^- \[(?:\\.|[^\]\\])+\]\((?:https:\/\/|mailto:)[^)\s]+\)(?:: .+)?$/);
    }
  });
});
