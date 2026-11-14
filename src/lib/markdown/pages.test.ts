import { describe, expect, it, vi } from "vitest";

import { getWorkSlugs } from "@/data";
import { getPublishedArticles } from "@/lib/articles";
import { renderMarkdown } from "./pages";

/**
 * 各ページの Markdown 版。外部フィード (Speaker Deck / Zenn / Qiita) は
 * 取りに行かないよう差し替え、自前記事だけが並ぶ形で見る。
 */
vi.mock("@/lib/output", async () => {
  const { getSelfOutputItems } = await import("@/lib/output/self");
  return {
    getOutputItems: async (locale: "ja" | "en") => ({
      talks: [
        {
          source: "speakerdeck",
          title: "登壇資料のテスト",
          url: "https://speakerdeck.com/riochin/test",
          publishedAt: "2026-10-01T00:00:00Z",
        },
      ],
      articles: getSelfOutputItems(locale),
    }),
    getRecentOutputs: async (locale: "ja" | "en") => ({
      talks: [],
      articles: getSelfOutputItems(locale).slice(0, 3),
    }),
  };
});

const article = getPublishedArticles()[0];

describe("renderMarkdown", () => {
  it.each([
    "/ja",
    "/en",
    "/ja/about",
    "/en/works",
    "/ja/experience",
    "/ja/output",
    `/ja/works/${getWorkSlugs()[0]}`,
    `/ja/blog/${article.slug}`,
    // 末尾のスラッシュは同じページ
    "/ja/works/",
  ])("%s は 200 で見出しから始まる", async (path) => {
    const { status, body } = await renderMarkdown(path);
    expect(status).toBe(200);
    expect(body).toMatch(/^# \S/);
    expect(body).toContain("https://riochin.dev/sitemap.xml");
  });

  it("記事は content/articles の本文をそのまま載せる", async () => {
    const { body } = await renderMarkdown(`/ja/blog/${article.slug}`);
    expect(body.startsWith(`# ${article.title}\n`)).toBe(true);
    expect(body).toContain(article.markdown.trim());
  });

  it("ロケールで文言が切り替わる", async () => {
    expect((await renderMarkdown("/ja/works")).body).toContain("受賞歴");
    expect((await renderMarkdown("/en/works")).body).toContain("Awards");
  });

  it("サイト内のリンクは絶対 URL", async () => {
    const { body } = await renderMarkdown("/ja");
    expect(body).toContain("(https://riochin.dev/ja/about)");
    expect(body).not.toMatch(/\]\(\/(?!\/)/);
  });

  it("一覧は外部の登壇資料と自前記事を載せる", async () => {
    const { body } = await renderMarkdown("/ja/output");
    expect(body).toContain("[登壇資料のテスト](https://speakerdeck.com/riochin/test)");
    expect(body).toContain(`(https://riochin.dev/ja/blog/${article.slug})`);
  });

  it.each([
    "/ja/no-such-page",
    "/ja/blog/no-such-article",
    "/ja/works/no-such-work",
    "/ja/blog",
    "/ja/about/extra",
    "/ja/%E0%A4%A",
    "/fr/works",
  ])("%s は 404 と戻り先の Markdown", async (path) => {
    const { status, body } = await renderMarkdown(path);
    expect(status).toBe(404);
    // 見出しを除いた説明が 20 文字以上
    expect(body.split("\n\n")[1].length).toBeGreaterThanOrEqual(20);
    expect(body).toContain("(https://riochin.dev/ja)");
    expect(body).toContain("(https://riochin.dev/ja/output#articles)");
    expect(body).toContain("(https://riochin.dev/sitemap.xml)");
  });

  it("英語の 404 は英語で返す", async () => {
    const { body } = await renderMarkdown("/en/nope");
    expect(body).toContain("may have moved");
    expect(body).toContain("(https://riochin.dev/en)");
  });
});
